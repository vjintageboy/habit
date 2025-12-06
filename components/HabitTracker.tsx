"use client"

import { useCurrentAccount } from "@iota/dapp-kit"
import { WalletConnect } from "@/components/Wallet-connect"
import { HabitList } from "@/components/habits/HabitList"
import { HabitCardWrapper } from "@/components/habits/HabitCardWrapper"
import { StatsDashboard } from "@/components/habits/StatsDashboard"
import { DeployWarning } from "@/components/DeployWarning"
import { Container, Heading, Flex, Text } from "@radix-ui/themes"
import { useState, useEffect } from "react"
import { useHabit } from "@/hooks/useHabit"
import type { Habit } from "@/types/habit"

export function HabitTracker() {
  const currentAccount = useCurrentAccount()
  const isConnected = !!currentAccount
  const [habitIds, setHabitIds] = useState<string[]>([])
  const [habits, setHabits] = useState<Habit[]>([])

  // Load habit IDs from localStorage (temporary solution)
  // In production, you'd query the blockchain for all habits owned by the user
  useEffect(() => {
    if (typeof window !== "undefined" && currentAccount?.address) {
      const stored = localStorage.getItem(`habits_${currentAccount.address}`)
      if (stored) {
        try {
          const ids = JSON.parse(stored)
          setHabitIds(ids)
        } catch (e) {
          console.error("Error loading habits:", e)
        }
      }
    }
  }, [currentAccount?.address])

  // Note: In production, you'd query all habits at once
  // For now, we'll use a simpler approach with individual habit cards

  const handleHabitCreated = (habitId: string) => {
    const newIds = [...habitIds, habitId]
    setHabitIds(newIds)
    if (currentAccount?.address) {
      localStorage.setItem(
        `habits_${currentAccount.address}`,
        JSON.stringify(newIds)
      )
    }
  }

  const handleHabitDeleted = (habitId: string) => {
    const newIds = habitIds.filter(id => id !== habitId)
    setHabitIds(newIds)
    if (currentAccount?.address) {
      localStorage.setItem(
        `habits_${currentAccount.address}`,
        JSON.stringify(newIds)
      )
    }
  }

  if (!isConnected) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
        <div style={{ maxWidth: "500px", width: "100%" }}>
          <Heading size="6" style={{ marginBottom: "1rem" }}>On-chain Habit Tracker</Heading>
          <Text style={{ marginBottom: "1rem", display: "block" }}>
            Track your habits on the IOTA blockchain. Every check-in is recorded on-chain, 
            ensuring your progress is permanent and verifiable.
          </Text>
          <Text color="gray" size="2">
            Please connect your wallet to get started.
          </Text>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", padding: "1rem", background: "var(--gray-a2)" }}>
      <Container style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <Flex direction="column" gap="4">
          <Flex justify="between" align="center">
            <div>
              <Heading size="8">📋 Habit Tracker</Heading>
              <Text size="2" color="gray">
                Build better habits, tracked on-chain
              </Text>
            </div>
            <WalletConnect />
          </Flex>

          <DeployWarning />

          {habitIds.length > 0 && (
            <StatsDashboard habitIds={habitIds} />
          )}

          <HabitList 
            habitIds={habitIds}
            onHabitCreated={handleHabitCreated}
          />

          {/* Display all habits */}
          {habitIds.length > 0 && (
            <Flex direction="column" gap="3">
              <Heading size="5">Your Habits</Heading>
              {habitIds.map(habitId => (
                <HabitCardWrapper
                  key={habitId}
                  habitId={habitId}
                  onCheckIn={() => {
                    // Refresh after check-in - in production, use proper state management
                    setTimeout(() => window.location.reload(), 2000)
                  }}
                  onDelete={() => handleHabitDeleted(habitId)}
                />
              ))}
            </Flex>
          )}
        </Flex>
      </Container>
    </div>
  )
}

