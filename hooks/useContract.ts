"use client"

/**
 * ============================================================================
 * IOTA CONTRACT INTEGRATION HOOK
 * ============================================================================
 * 
 * This hook contains ALL the contract interaction logic.
 * 
 * To customize your dApp, modify the configuration section below.
 * 
 * ============================================================================
 */

import { useState, useEffect } from "react"
import {
  useCurrentAccount,
  useIotaClient,
  useSignAndExecuteTransaction,
  useIotaClientQuery,
} from "@iota/dapp-kit"
import { Transaction } from "@iota/iota-sdk/transactions"
import { useNetworkVariable } from "@/lib/config"
import type { IotaObjectData } from "@iota/iota-sdk/client"

// ============================================================================
// CONTRACT CONFIGURATION
// ============================================================================
// Change these values to match your Move contract

export const CONTRACT_MODULE = "contract" // Your Move module name
export const CONTRACT_METHODS = {
  CREATE: "create",
  INCREMENT: "increment",
  SET_VALUE: "set_value",
} as const

// ============================================================================
// DATA EXTRACTION
// ============================================================================
// Modify this to extract data from your contract's object structure

function getObjectFields(data: IotaObjectData): { value: number; owner: string } | null {
  if (data.content?.dataType !== "moveObject") {
    console.log("Data is not a moveObject:", data.content?.dataType)
    return null
  }
  
  const fields = data.content.fields as any
  if (!fields) {
    console.log("No fields found in object data")
    return null
  }
  
  // Log the actual structure for debugging
  console.log("Object fields structure:", JSON.stringify(fields, null, 2))
  
  // Handle value - it might be a string (u64) or number
  let value: number
  if (typeof fields.value === "string") {
    value = parseInt(fields.value, 10)
    if (isNaN(value)) {
      console.log("Value is not a valid number:", fields.value)
      return null
    }
  } else if (typeof fields.value === "number") {
    value = fields.value
  } else {
    console.log("Value is not a number or string:", typeof fields.value, fields.value)
    return null
  }
  
  // Handle owner - convert to string
  if (!fields.owner) {
    console.log("Owner field is missing")
    return null
  }
  
  const owner = String(fields.owner)
  
  return {
    value,
    owner,
  }
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export interface ContractData {
  value: number
  owner: string
}

export interface ContractState {
  isLoading: boolean
  isPending: boolean
  isConfirming: boolean
  isConfirmed: boolean
  hash: string | undefined
  error: Error | null
}

export interface ContractActions {
  createObject: () => Promise<void>
  increment: () => Promise<void>
  reset: () => Promise<void>
  clearObject: () => void
}

export const useContract = () => {
  const currentAccount = useCurrentAccount()
  const address = currentAccount?.address
  const packageId = useNetworkVariable("packageId")
  const iotaClient = useIotaClient()
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction()
  const [objectId, setObjectId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hash, setHash] = useState<string | undefined>()
  const [transactionError, setTransactionError] = useState<Error | null>(null)

  // Load object ID from URL hash
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.slice(1)
      if (hash) setObjectId(hash)
    }
  }, [])

  // Fetch object data
  const { data, isPending: isFetching, error: queryError, refetch } = useIotaClientQuery(
    "getObject",
    {
      id: objectId!,
      options: { showContent: true, showOwner: true },
    },
    {
      enabled: !!objectId,
    }
  )

  // Extract fields
  const fields = data?.data ? getObjectFields(data.data) : null
  const isOwner = fields?.owner.toLowerCase() === address?.toLowerCase()
  
  // Check if object exists but data extraction failed
  const objectExists = !!data?.data
  const hasValidData = !!fields

  // Create object
  const createObject = async () => {
    if (!packageId) return

    try {
      setIsLoading(true)
      setTransactionError(null)
      setHash(undefined)
      const tx = new Transaction()
      tx.moveCall({
        arguments: [],
        target: `${packageId}::${CONTRACT_MODULE}::${CONTRACT_METHODS.CREATE}`,
      })

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async ({ digest }) => {
            setHash(digest)
            try {
              const { effects } = await iotaClient.waitForTransaction({
                digest,
                options: { showEffects: true },
              })
              const newObjectId = effects?.created?.[0]?.reference?.objectId
              if (newObjectId) {
                setObjectId(newObjectId)
                if (typeof window !== "undefined") {
                  window.location.hash = newObjectId
                }
                // Reset loading - the query will handle its own loading state
                setIsLoading(false)
              } else {
                setIsLoading(false)
                console.warn("No object ID found in transaction effects")
              }
            } catch (waitError) {
              console.error("Error waiting for transaction:", waitError)
              setIsLoading(false)
            }
          },
          onError: (err) => {
            const error = err instanceof Error ? err : new Error(String(err))
            setTransactionError(error)
            console.error("Error:", err)
            setIsLoading(false)
          },
        }
      )
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setTransactionError(error)
      console.error("Error creating object:", err)
      setIsLoading(false)
    }
  }

  // Increment
  const increment = async () => {
    if (!objectId || !packageId) return

    try {
      setIsLoading(true)
      setTransactionError(null)
      const tx = new Transaction()
      tx.moveCall({
        arguments: [tx.object(objectId)],
        target: `${packageId}::${CONTRACT_MODULE}::${CONTRACT_METHODS.INCREMENT}`,
      })

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async ({ digest }) => {
            setHash(digest)
            await iotaClient.waitForTransaction({ digest })
            await refetch()
            setIsLoading(false)
          },
          onError: (err) => {
            const error = err instanceof Error ? err : new Error(String(err))
            setTransactionError(error)
            console.error("Error:", err)
            setIsLoading(false)
          },
        }
      )
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setTransactionError(error)
      console.error("Error incrementing:", err)
      setIsLoading(false)
    }
  }

  // Reset
  const reset = async () => {
    if (!objectId || !packageId) return

    try {
      setIsLoading(true)
      setTransactionError(null)
      const tx = new Transaction()
      tx.moveCall({
        arguments: [tx.object(objectId), tx.pure.u64(0)],
        target: `${packageId}::${CONTRACT_MODULE}::${CONTRACT_METHODS.SET_VALUE}`,
      })

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async ({ digest }) => {
            setHash(digest)
            await iotaClient.waitForTransaction({ digest })
            await refetch()
            setIsLoading(false)
          },
          onError: (err) => {
            const error = err instanceof Error ? err : new Error(String(err))
            setTransactionError(error)
            console.error("Error:", err)
            setIsLoading(false)
          },
        }
      )
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setTransactionError(error)
      console.error("Error resetting:", err)
      setIsLoading(false)
    }
  }

  const contractData: ContractData | null = fields
    ? {
        value: fields.value,
        owner: fields.owner,
      }
    : null

  const clearObject = () => {
    setObjectId(null)
    setTransactionError(null)
    if (typeof window !== "undefined") {
      window.location.hash = ""
    }
  }

  const actions: ContractActions = {
    createObject,
    increment,
    reset,
    clearObject,
  }

  const contractState: ContractState = {
    isLoading: (isLoading && !objectId) || isPending || isFetching,
    isPending,
    isConfirming: false,
    isConfirmed: !!hash && !isLoading && !isPending,
    hash,
    error: queryError || transactionError,
  }

  return {
    data: contractData,
    actions,
    state: contractState,
    objectId,
    isOwner,
    objectExists,
    hasValidData,
  }
}

