import { cache } from "react";
import { prisma } from "./prisma";

export const getSettings = cache(async () => {
  return prisma.setting.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
});
