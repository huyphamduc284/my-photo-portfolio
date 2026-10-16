"use server";

import { revalidatePath } from "next/cache";

export async function revalidateArchive() {
  revalidatePath("/");
  revalidatePath("/archive");
  revalidatePath("/admin");
}
