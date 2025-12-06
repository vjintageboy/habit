"use client"

/**
 * ============================================================================
 * HABIT TRACKER HOOK
 * ============================================================================
 * 
 * Hook for interacting with the Habit Tracker contract
 * 
 * ============================================================================
 */

import { useState, useEffect, useCallback } from "react"
import {
  useCurrentAccount,
  useIotaClient,
  useSignAndExecuteTransaction,
  useIotaClientQuery,
} from "@iota/dapp-kit"
import { Transaction } from "@iota/iota-sdk/transactions"
import { useNetworkVariable } from "@/lib/config"
import type { IotaObjectData } from "@iota/iota-sdk/client"
import type { Habit, CreateHabitInput, UpdateHabitInput, CheckInInput } from "@/types/habit"
import { goalTypeToNumber, goalTypeToString } from "@/types/habit"

// ============================================================================
// CONTRACT CONFIGURATION
// ============================================================================

export const CONTRACT_MODULE = "contract"
export const CONTRACT_METHODS = {
  CREATE_HABIT: "create_habit",
  CHECK_IN: "check_in",
  UPDATE_HABIT: "update_habit",
  DELETE_HABIT: "delete_habit",
} as const

// ============================================================================
// DATA EXTRACTION
// ============================================================================

export function getHabitFields(data: IotaObjectData): Habit | null {
  if (data.content?.dataType !== "moveObject") {
    console.log("Data is not a moveObject:", data.content?.dataType)
    return null
  }

  const fields = data.content.fields as any
  if (!fields) {
    console.log("No fields found in object data")
    return null
  }

  try {
    // Parse all fields
    const owner = String(fields.owner || "")
    const name = String(fields.name || "")
    const description = String(fields.description || "")
    const emoji = String(fields.emoji || "📝")

    const createdAt = typeof fields.created_at === "string"
      ? parseInt(fields.created_at, 10)
      : (fields.created_at || 0)

    const goalTypeRaw = typeof fields.goal_type === "string"
      ? parseInt(fields.goal_type, 10)
      : (fields.goal_type || 0)

    const goalCount = typeof fields.goal_count === "string"
      ? parseInt(fields.goal_count, 10)
      : (fields.goal_count || 1)

    const totalCheckins = typeof fields.total_checkins === "string"
      ? parseInt(fields.total_checkins, 10)
      : (fields.total_checkins || 0)

    const currentStreak = typeof fields.current_streak === "string"
      ? parseInt(fields.current_streak, 10)
      : (fields.current_streak || 0)

    const longestStreak = typeof fields.longest_streak === "string"
      ? parseInt(fields.longest_streak, 10)
      : (fields.longest_streak || 0)

    const lastCheckinDate = fields.last_checkin_date
      ? (typeof fields.last_checkin_date === "string"
        ? parseInt(fields.last_checkin_date, 10)
        : fields.last_checkin_date)
      : null

    const isPublic = Boolean(fields.is_public)

    const objectId = data.objectId || ""

    return {
      id: objectId,
      owner,
      name,
      description,
      emoji,
      createdAt,
      goalType: goalTypeToString(goalTypeRaw),
      goalTypeRaw,
      goalCount,
      totalCheckins,
      currentStreak,
      longestStreak,
      lastCheckinDate,
      isPublic,
    }
  } catch (error) {
    console.error("Error parsing habit fields:", error, fields)
    return null
  }
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export interface HabitState {
  isLoading: boolean
  isPending: boolean
  isConfirming: boolean
  isConfirmed: boolean
  hash: string | undefined
  error: Error | null
}

export interface HabitActions {
  createHabit: (input: CreateHabitInput) => Promise<string | null>
  checkIn: (habitId: string, input?: CheckInInput) => Promise<void>
  updateHabit: (habitId: string, input: UpdateHabitInput) => Promise<void>
  deleteHabit: (habitId: string) => Promise<void>
  refreshHabit: (habitId: string) => Promise<void>
}

export const useHabit = (habitId?: string | null) => {
  const currentAccount = useCurrentAccount()
  const address = currentAccount?.address
  const packageId = useNetworkVariable("packageId")
  const iotaClient = useIotaClient()
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction()
  const [isLoading, setIsLoading] = useState(false)
  const [hash, setHash] = useState<string | undefined>()
  const [transactionError, setTransactionError] = useState<Error | null>(null)

  // Fetch habit data if habitId is provided
  const { data, isPending: isFetching, error: queryError, refetch } = useIotaClientQuery(
    "getObject",
    {
      id: habitId!,
      options: { showContent: true, showOwner: true },
    },
    {
      enabled: !!habitId,
    }
  )

  // Extract habit data
  const habit: Habit | null = data?.data ? getHabitFields(data.data) : null
  const isOwner = habit?.owner.toLowerCase() === address?.toLowerCase()
  const objectExists = !!data?.data
  const hasValidData = !!habit

  // Create habit
  const createHabit = useCallback(async (input: CreateHabitInput): Promise<string | null> => {
    if (!packageId) {
      throw new Error(
        "Package ID not configured. Please deploy the contract first by running: npm run iota-deploy"
      )
    }

    try {
      setIsLoading(true)
      setTransactionError(null)
      setHash(undefined)

      const tx = new Transaction()

      // Convert strings to vector<u8> (bytes)
      const nameBytes = new TextEncoder().encode(input.name)
      const descriptionBytes = new TextEncoder().encode(input.description)
      const emojiBytes = new TextEncoder().encode(input.emoji)

      tx.moveCall({
        arguments: [
          tx.pure.vector("u8", nameBytes),
          tx.pure.vector("u8", descriptionBytes),
          tx.pure.vector("u8", emojiBytes),
          tx.pure.u8(goalTypeToNumber(input.goalType)),
          tx.pure.u64(input.goalCount),
          tx.pure.bool(input.isPublic),
        ],
        target: `${packageId}::${CONTRACT_MODULE}::${CONTRACT_METHODS.CREATE_HABIT}`,
      })

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx as any },
          {
            onSuccess: async ({ digest }) => {
              setHash(digest)
              try {
                const { effects } = await iotaClient.waitForTransaction({
                  digest,
                  options: { showEffects: true },
                })
                const newHabitId = effects?.created?.[0]?.reference?.objectId
                if (newHabitId) {
                  setIsLoading(false)
                  resolve(newHabitId)
                } else {
                  setIsLoading(false)
                  reject(new Error("No habit ID found in transaction effects"))
                }
              } catch (waitError) {
                console.error("Error waiting for transaction:", waitError)
                setIsLoading(false)
                reject(waitError)
              }
            },
            onError: (err) => {
              const error = err instanceof Error ? err : new Error(String(err))
              setTransactionError(error)
              setIsLoading(false)
              reject(error)
            },
          }
        )
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setTransactionError(error)
      setIsLoading(false)
      throw error
    }
  }, [packageId, signAndExecute, iotaClient])

  // Check in
  const checkIn = useCallback(async (habitId: string, input?: CheckInInput) => {
    if (!habitId || !packageId) return

    try {
      setIsLoading(true)
      setTransactionError(null)

      const tx = new Transaction()

      // Simplified: pass vector<u8> directly, empty vector = no notes
      const notesBytes = input?.notes && input.notes.trim()
        ? new TextEncoder().encode(input.notes.trim())
        : new Uint8Array(0)

      // Use tx.object() - SDK will handle shared objects automatically
      tx.moveCall({
        arguments: [
          tx.object(habitId),
          tx.pure.vector("u8", notesBytes),
        ],
        target: `${packageId}::${CONTRACT_MODULE}::${CONTRACT_METHODS.CHECK_IN}`,
      })

      return new Promise<void>((resolve, reject) => {
        signAndExecute(
          { transaction: tx as any },
          {
            onSuccess: async ({ digest }) => {
              console.log("Check-in submitted, digest:", digest)
              setHash(digest)
              try {
                const tx = await iotaClient.waitForTransaction({
                  digest,
                  options: {
                    showEffects: true,
                    showEvents: true
                  }
                })

                console.log("Transaction status:", tx.effects?.status.status)

                if (tx.effects?.status.status === "failure") {
                  console.error("Transaction failed:", tx.effects.status.error)
                  setTransactionError(new Error(`Transaction failed: ${tx.effects.status.error || "Unknown error"}`))
                  reject(new Error(`Transaction failed: ${tx.effects.status.error || "Unknown error"}`))
                } else {
                  console.log("Transaction successful, refreshing data...")
                  if (habitId === habit?.id) {
                    await refetch()
                    console.log("Data refetched")
                  }
                  resolve()
                }
              } catch (waitError) {
                console.error("Error waiting for transaction:", waitError)
                reject(waitError)
              }
              setIsLoading(false)
            },
            onError: (err) => {
              console.error("Transaction submission error:", err)
              const error = err instanceof Error ? err : new Error(String(err))
              setTransactionError(error)
              setIsLoading(false)
              reject(error)
            },
          }
        )
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setTransactionError(error)
      setIsLoading(false)
    }
  }, [packageId, signAndExecute, iotaClient, habit?.id, refetch])

  // Update habit
  const updateHabit = useCallback(async (habitId: string, input: UpdateHabitInput) => {
    if (!habitId || !packageId) return

    try {
      setIsLoading(true)
      setTransactionError(null)

      const tx = new Transaction()
      const args: any[] = [tx.object(habitId)]

      // Add optional fields (String = vector<u8> in Move)
      args.push(
        input.name
          ? tx.pure.option("vector<u8>", Array.from(new TextEncoder().encode(input.name)))
          : tx.pure.option("vector<u8>", null),
        input.description
          ? tx.pure.option("vector<u8>", Array.from(new TextEncoder().encode(input.description)))
          : tx.pure.option("vector<u8>", null),
        input.emoji
          ? tx.pure.option("vector<u8>", Array.from(new TextEncoder().encode(input.emoji)))
          : tx.pure.option("vector<u8>", null),
        input.goalType !== undefined
          ? tx.pure.option("u8", goalTypeToNumber(input.goalType))
          : tx.pure.option("u8", null),
        input.goalCount !== undefined
          ? tx.pure.option("u64", input.goalCount)
          : tx.pure.option("u64", null),
        input.isPublic !== undefined
          ? tx.pure.option("bool", input.isPublic)
          : tx.pure.option("bool", null),
      )

      tx.moveCall({
        arguments: args,
        target: `${packageId}::${CONTRACT_MODULE}::${CONTRACT_METHODS.UPDATE_HABIT}`,
      })

      return new Promise<void>((resolve, reject) => {
        signAndExecute(
          { transaction: tx as any },
          {
            onSuccess: async ({ digest }) => {
              setHash(digest)
              try {
                await iotaClient.waitForTransaction({ digest })
                if (habitId === habit?.id) {
                  await refetch()
                }
                resolve()
              } catch (error) {
                reject(error)
              } finally {
                setIsLoading(false)
              }
            },
            onError: (err) => {
              const error = err instanceof Error ? err : new Error(String(err))
              setTransactionError(error)
              setIsLoading(false)
              reject(error)
            },
          }
        )
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setTransactionError(error)
      setIsLoading(false)
    }
  }, [packageId, signAndExecute, iotaClient, habit?.id, refetch])

  // Delete habit
  const deleteHabit = useCallback(async (habitId: string) => {
    if (!habitId || !packageId) return

    try {
      setIsLoading(true)
      setTransactionError(null)

      const tx = new Transaction()
      tx.moveCall({
        arguments: [tx.object(habitId)],
        target: `${packageId}::${CONTRACT_MODULE}::${CONTRACT_METHODS.DELETE_HABIT}`,
      })

      return new Promise<void>((resolve, reject) => {
        signAndExecute(
          { transaction: tx as any },
          {
            onSuccess: async ({ digest }) => {
              setHash(digest)
              try {
                await iotaClient.waitForTransaction({ digest })
                resolve()
              } catch (error) {
                reject(error)
              } finally {
                setIsLoading(false)
              }
            },
            onError: (err) => {
              const error = err instanceof Error ? err : new Error(String(err))
              setTransactionError(error)
              setIsLoading(false)
              reject(error)
            },
          }
        )
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setTransactionError(error)
      setIsLoading(false)
    }
  }, [packageId, signAndExecute, iotaClient])

  // Refresh habit
  const refreshHabit = useCallback(async (habitId: string) => {
    if (habitId === habit?.id) {
      await refetch()
    }
  }, [habit?.id, refetch])

  const actions: HabitActions = {
    createHabit,
    checkIn,
    updateHabit,
    deleteHabit,
    refreshHabit,
  }

  const habitState: HabitState = {
    // Only show loading if we're actually fetching a habit or executing a transaction
    isLoading: (habitId && (isLoading || isPending || isFetching)) || (!habitId && (isLoading || isPending)),
    isPending,
    isConfirming: false,
    isConfirmed: !!hash && !isLoading && !isPending,
    hash,
    error: queryError || transactionError,
  }

  return {
    habit,
    actions,
    state: habitState,
    habitId,
    isOwner,
    objectExists,
    hasValidData,
  }
}

