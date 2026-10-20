export interface ElementRef {
    readonly current: HTMLElement | null;
}

export interface CapturedPng {
    dataUrl: string;
    width: number;
    height: number;
}

export async function captureElementPng(elementRef: ElementRef): Promise<CapturedPng> {
    const element = elementRef.current;
    if (!element) throw new Error("Element is not mounted");

    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(element, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
    });

    return {
        dataUrl,
        width: element.offsetWidth,
        height: element.offsetHeight,
    };
}

export function downloadDataUrl(dataUrl: string, fileName: string): void {
    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
}
