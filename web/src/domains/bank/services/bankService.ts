"use client";

import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";
import type { Bank } from "../types";

class BankService extends BaseRepository<Bank> {
    protected resource = "banks";
    protected adapter = browserAdapter;
}

export const bankService = new BankService();
