"use server";

import { signOut } from "~/server/auth";

export const signOutAction = async () => {
  return signOut();
};
