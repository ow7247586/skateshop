import type { NextRequest } from "next/server"
import { currentUser } from "@clerk/nextjs"
import * as z from "zod"

import { prisma } from "@/lib/db"
import { editStoreSchema } from "@/lib/validations/store"

export async function PATCH(req: NextRequest) {
  try {
    const user = await currentUser()

    if (!user) {
      return new Response("Unauthorized.", { status: 403 })
    }

    const input = editStoreSchema.parse(await req.json())

    const storeWithSameName = await prisma.store.findFirst({
      where: {
        name: input.name,
        id: {
          not: input.storeId,
        },
      },
    })

    if (storeWithSameName) {
      return new Response("A store with the same name already exists.", {
        status: 409,
      })
    }

    const updatedStore = await prisma.store.update({
      where: { id: input.storeId },
      data: {
        name: input.name,
        description: input.description,
      },
    })

    return new Response(JSON.stringify(updatedStore), { status: 200 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.issues), { status: 422 })
    } else if (error instanceof Error) {
      return new Response(error.message, { status: 500 })
    } else {
      return new Response(null, { status: 500 })
    }
  }
}
