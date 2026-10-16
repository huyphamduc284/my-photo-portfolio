"use server";

import { revalidatePath } from "next/cache";

export async function revalidateArchive() {
  revalidatePath("/");
  revalidatePath("/archive");
  revalidatePath("/admin");
}

export async function revalidateJournal(slug?: string) {
  revalidatePath("/");
  revalidatePath("/journal");
  revalidatePath("/admin");
  if (slug) {
    revalidatePath(`/journal/${slug}`);
  }
}
