/**
 * Canonical, user-facing dashboard widget names.
 * Internal IDs and saved layout keys must stay unchanged for existing users.
 * Use these labels in widget libraries, dashboard headings, and edit controls.
 */
export const homeWidgetNames={
 recent:"Recently Updated",
 colony:"My Colony",
 games:"Play a Little",
 progress:"My Progress",
 schedule:"Care Schedule",
 guides:"Field Guide",
 community:"Community",
 pins:"Favorites",
} as const;

export const managerWidgetNames={
 hero:"Manager Overview",
 stats:"Colony Totals",
 care:"Care Schedule",
 tools:"Quick Tools",
 activity:"Recent Care",
 enclosures:"Your Bins",
 insights:"Colony Insights",
} as const;
