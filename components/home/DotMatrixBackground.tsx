"use client";

import { useRef, useEffect, useCallback } from "react";

export function DotMatrixBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: -1000, y: -1000 });
    const animationRef = useRef<number>(0);
    const sizeRef = useRef({ w: 0, h: 0 });

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        if (sizeRef.current.w !== w || sizeRef.current.h !== h) {
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            ctx.scale(dpr, dpr);
            sizeRef.current = { w, h };
        } else {
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        ctx.clearRect(0, 0, w, h);

        const spacing = 28;
        const baseRadius = 1.8;
        const maxRadius = 4.5;
        const influenceRadius = 140;
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;

        for (let x = spacing / 2; x < w; x += spacing) {
            for (let y = spacing / 2; y < h; y += spacing) {
                const dx = x - mx;
                const dy = y - my;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const t = Math.max(0, 1 - dist / influenceRadius);
                const radius = baseRadius + (maxRadius - baseRadius) * t;
                // Default dots are visible (alpha 0.25), hover makes them darker (up to 0.85)
                const alpha = 0.25 + 0.6 * t;

                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(32, 95%, 50%, ${alpha})`;
                ctx.fill();
            }
        }

        animationRef.current = requestAnimationFrame(draw);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        };

        const handleLeave = () => {
            mouseRef.current = { x: -1000, y: -1000 };
        };

        const parent = canvas.parentElement;
        if (parent) {
            parent.addEventListener("mousemove", handleMove);
            parent.addEventListener("mouseleave", handleLeave);
        }

        animationRef.current = requestAnimationFrame(draw);

        return () => {
            if (parent) {
                parent.removeEventListener("mousemove", handleMove);
                parent.removeEventListener("mouseleave", handleLeave);
            }
            cancelAnimationFrame(animationRef.current);
        };
    }, [draw]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: "none" }}
        />
    );
}
