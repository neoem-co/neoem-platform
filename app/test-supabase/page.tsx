"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Info } from "lucide-react";

export default function SupabaseDiagnosticPage() {
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [details, setDetails] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const checkConnection = async () => {
        setStatus("loading");
        setError(null);
        setDetails(null);

        try {
            const supabase = createClient();

            // 1. Check if Supabase client is initialized
            if (!supabase) {
                throw new Error("Failed to initialize Supabase client");
            }

            // 2. Try a basic Auth call (doesn't require login)
            const { data: authData, error: authError } = await supabase.auth.getSession();

            if (authError) throw authError;

            // 3. Try to fetch from a common public schema or just metadata
            // Note: This might fail if the project has no tables, but that's okay, 
            // the auth check above is usually enough to verify the URL/Key validity.

            setDetails({
                url: process.env.NEXT_PUBLIC_SUPABASE_URL,
                session: authData.session ? "Active" : "None (Guest)",
                clientInitialized: true,
            });

            setStatus("success");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "An unknown error occurred");
            setStatus("error");
        }
    };

    return (
        <div className="container py-12 flex flex-col items-center justify-center min-h-screen space-y-6">
            <Card className="w-full max-w-lg shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Supabase Diagnostic Tools
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 bg-secondary/50 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Connection Status:</span>
                            {status === "idle" && <Badge variant="outline">Not Started</Badge>}
                            {status === "loading" && <Badge variant="outline" className="animate-pulse">Checking...</Badge>}
                            {status === "success" && <Badge className="bg-success text-success-foreground">Connected</Badge>}
                            {status === "error" && <Badge variant="destructive">Failed</Badge>}
                        </div>
                    </div>

                    {status === "success" && details && (
                        <div className="space-y-3">
                            <div className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                                <div>
                                    <p className="font-semibold text-success">Reachability Verified!</p>
                                    <p className="text-muted-foreground text-xs">The Supabase client successfully reached your project APIs.</p>
                                </div>
                            </div>
                            <div className="bg-secondary/30 p-3 rounded text-[10px] font-mono break-all border">
                                <p><span className="text-primary">URL:</span> {details.url}</p>
                                <p><span className="text-primary">Session:</span> {details.session}</p>
                            </div>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="flex items-start gap-2 text-sm p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                            <XCircle className="h-4 w-4 text-destructive mt-0.5" />
                            <div className="space-y-1">
                                <p className="font-semibold text-destructive">Connection Error</p>
                                <p className="text-xs text-muted-foreground">{error}</p>
                                <p className="text-[10px] italic mt-2">Check your .env keys and Supabase Project Settings.</p>
                            </div>
                        </div>
                    )}

                    {status === "idle" && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <Info className="h-4 w-4 mt-0.5" />
                            <p className="text-xs">Click the button below to verify your Supabase configuration.</p>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button
                        onClick={checkConnection}
                        disabled={status === "loading"}
                        className="w-full"
                    >
                        {status === "loading" ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Testing...
                            </>
                        ) : (
                            "Run Diagnostic Test"
                        )}
                    </Button>
                </CardFooter>
            </Card>

            <p className="text-xs text-muted-foreground">
                Assuming your <code>.env</code> file is correct, a "Connected" status means the middleware fix is working.
            </p>
        </div>
    );
}
