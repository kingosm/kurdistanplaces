import { useLayoutEditor } from "@/contexts/LayoutEditorContext";
import { cn } from "@/lib/utils";
import { EyeOff, Eye } from "lucide-react";

const LANGUAGES = [
    { code: "en", label: "EN" },
    { code: "ku", label: "KU" },
    { code: "ar", label: "AR" },
];

// Predefined layouts keyed by `page|breakpoint|element_id`
// x/y are CSS transform offsets in px from the element's natural position
const PRESETS: Array<{
    id: string;
    name: string;
    description: string;
    emoji: string;
    layouts: Record<string, { x: number; y: number; width?: number; height?: number }>;
}> = [
        {
            id: "reset",
            name: "Default",
            description: "Reset everything to original positions",
            emoji: "↩",
            layouts: {
                "index|desktop|hero_badge": { x: 0, y: 0 },
                "index|desktop|hero_title": { x: 0, y: 0 },
                "index|desktop|hero_desc": { x: 0, y: 0 },
                "index|desktop|hero_stats": { x: 0, y: 0 },
                "__global__|desktop|header_logo": { x: 0, y: 0 },
                "__global__|desktop|header_nav": { x: 0, y: 0 },
            },
        },
        {
            id: "hero-bold",
            name: "Hero Bold",
            description: "Title pushed up, stats spread down",
            emoji: "🔥",
            layouts: {
                "index|desktop|hero_badge": { x: 0, y: -16 },
                "index|desktop|hero_title": { x: 0, y: 8 },
                "index|desktop|hero_desc": { x: 0, y: 24 },
                "index|desktop|hero_stats": { x: 0, y: 40 },
            },
        },
        {
            id: "hero-left",
            name: "Hero Left",
            description: "Hero content shifted to the left",
            emoji: "⇤",
            layouts: {
                "index|desktop|hero_badge": { x: -160, y: 0 },
                "index|desktop|hero_title": { x: -160, y: 0 },
                "index|desktop|hero_desc": { x: -160, y: 0 },
                "index|desktop|hero_stats": { x: -160, y: 0 },
            },
        },
        {
            id: "hero-compact",
            name: "Compact",
            description: "Tight spacing between hero elements",
            emoji: "📦",
            layouts: {
                "index|desktop|hero_badge": { x: 0, y: 8 },
                "index|desktop|hero_title": { x: 0, y: -8 },
                "index|desktop|hero_desc": { x: 0, y: -16 },
                "index|desktop|hero_stats": { x: 0, y: -24 },
            },
        },
    ];

interface LayoutPresetsProps {
    onClose: () => void;
}

export function LayoutPresets({ onClose }: LayoutPresetsProps) {
    const { setElementLayout, isLayoutEditMode } = useLayoutEditor();

    const applyPreset = (presetId: string) => {
        const preset = PRESETS.find(p => p.id === presetId);
        if (!preset || !isLayoutEditMode) return;

        for (const [key, layout] of Object.entries(preset.layouts)) {
            const [page, bp, ...idParts] = key.split("|");
            const id = idParts.join("|");
            // We temporarily need to call setElementLayout for each.
            // Since setElementLayout uses activeBreakpoint internally,
            // we apply directly via the raw function.
            setElementLayout(id, page, { x: layout.x, y: layout.y, width: layout.width, height: layout.height });
        }
        onClose();
    };

    return (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-[10000] w-72 bg-zinc-900/98 border border-zinc-700 rounded-2xl shadow-2xl backdrop-blur-md p-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-2 pb-2">
                Layout Presets
            </p>
            <div className="space-y-1">
                {PRESETS.map(preset => (
                    <button
                        key={preset.id}
                        onClick={() => applyPreset(preset.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors text-left group"
                    >
                        <span className="text-xl w-7 text-center">{preset.emoji}</span>
                        <div>
                            <p className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">{preset.name}</p>
                            <p className="text-[10px] text-zinc-500">{preset.description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

// ── Visibility Toggle Panel (used inside EditableBlock toolbar) ───────────────

interface VisibilityTogglesProps {
    id: string;
    page: string;
}

export function VisibilityToggles({ id, page }: VisibilityTogglesProps) {
    const { getVisibility, setVisibility } = useLayoutEditor();
    const vis = getVisibility(id, page);

    const toggle = (field: keyof typeof vis) => {
        if (field === "hideOnLanguages") return; // handled below
        setVisibility(id, page, { ...vis, [field]: !vis[field] });
    };

    const toggleLang = (code: string) => {
        const langs = vis.hideOnLanguages ?? [];
        const next = langs.includes(code) ? langs.filter(l => l !== code) : [...langs, code];
        setVisibility(id, page, { ...vis, hideOnLanguages: next });
    };

    const isHiding = vis.hideOnMobile || vis.hideOnTablet || vis.hideOnDesktop || (vis.hideOnLanguages?.length ?? 0) > 0;

    return (
        <div className="flex items-center gap-0.5">
            {/* Breakpoint hide toggles */}
            {(["mobile", "tablet", "desktop"] as const).map(bp => {
                const field = `hideOn${bp.charAt(0).toUpperCase() + bp.slice(1)}` as keyof typeof vis;
                const active = !!vis[field];
                const icons: Record<string, string> = { mobile: "📱", tablet: "💻", desktop: "🖥" };
                return (
                    <button
                        key={bp}
                        onClick={() => toggle(field)}
                        title={active ? `Show on ${bp}` : `Hide on ${bp}`}
                        className={cn(
                            "text-[9px] w-6 h-6 rounded flex items-center justify-center transition-all",
                            active
                                ? "bg-rose-500/30 text-rose-400 ring-1 ring-rose-500/50"
                                : "hover:bg-white/10 text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        {active ? <EyeOff className="w-2.5 h-2.5" /> : <span>{icons[bp]}</span>}
                    </button>
                );
            })}

            {/* Language hide toggles */}
            {LANGUAGES.map(({ code, label }) => {
                const active = vis.hideOnLanguages?.includes(code) ?? false;
                return (
                    <button
                        key={code}
                        onClick={() => toggleLang(code)}
                        title={active ? `Show in ${label}` : `Hide in ${label}`}
                        className={cn(
                            "text-[8px] font-black w-6 h-6 rounded transition-all",
                            active
                                ? "bg-rose-500/30 text-rose-400 ring-1 ring-rose-500/50"
                                : "hover:bg-white/10 text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        {label}
                    </button>
                );
            })}

            {/* Summary indicator */}
            {isHiding && (
                <span className="text-[8px] text-rose-400 font-bold ml-0.5 flex items-center gap-0.5">
                    <EyeOff className="w-2 h-2" /> hidden
                </span>
            )}
        </div>
    );
}
