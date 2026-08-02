import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";

import { TableActionItem } from "@/components/shared/ui/TableActionItem";


export function CopyLinkButton({ link }: { link: string }) {
    const [copied, setCopied] = useState(false);
    const ti = useTranslations("invite");

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback
            const el = document.createElement("textarea");
            el.value = link;
            document.body.appendChild(el);
            el.select();
            document.execCommand("copy");
            document.body.removeChild(el);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <TableActionItem
            icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            label={copied ? ti("copied") : ti("copyLink")}
            onClick={handleCopy}
        />
    );
}