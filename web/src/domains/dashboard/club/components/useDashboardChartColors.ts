"use client";

import { useEffect, useState } from "react";

const fallbackColors = {
  income: "#0f9f8c",
  expense: "#f27662",
  net: "#5b5ce2",
  total: "#5b5ce2",
  male: "#3b82f6",
  female: "#ec4899",
  groups: "#f59e0b",
  grid: "#e4e4e7",
  background: "#ffffff",
  backgroundSubtle: "#f8fafc",
  foregroundMuted: "#71717a",
  borderStrong: "#d4d4d8",
};

export type DashboardChartColors = typeof fallbackColors;

function readChartColors(): DashboardChartColors {
  const styles = window.getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) =>
    styles.getPropertyValue(name).trim() || fallback;

  return {
    income: read("--chart-income", fallbackColors.income),
    expense: read("--chart-expense", fallbackColors.expense),
    net: read("--chart-net", fallbackColors.net),
    total: read("--chart-total", fallbackColors.total),
    male: read("--chart-male", fallbackColors.male),
    female: read("--chart-female", fallbackColors.female),
    groups: read("--chart-groups", fallbackColors.groups),
    grid: read("--border", fallbackColors.grid),
    background: read("--background", fallbackColors.background),
    backgroundSubtle: read("--background-subtle", fallbackColors.backgroundSubtle),
    foregroundMuted: read("--foreground-muted", fallbackColors.foregroundMuted),
    borderStrong: read("--border-strong", fallbackColors.borderStrong),
  };
}

export function useDashboardChartColors() {
  const [colors, setColors] = useState<DashboardChartColors>(fallbackColors);

  useEffect(() => {
    const update = () => setColors(readChartColors());
    const observer = new MutationObserver(update);

    update();
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => observer.disconnect();
  }, []);

  return colors;
}
