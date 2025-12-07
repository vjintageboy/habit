"use client"

import { useState, useEffect } from "react"
import { Card, Flex, Heading, Text } from "@radix-ui/themes"
import { useIotaClient } from "@iota/dapp-kit"
import { getHabitFields } from "@/hooks/useHabit"
import type { Habit } from "@/types/habit"
import { isSameDay } from "@/types/habit"

interface StatsDashboardProps {
  habitIds: string[]
}

export function StatsDashboard({ habitIds }: StatsDashboardProps) {
  const iotaClient = useIotaClient()
  const [habits, setHabits] = useState<Habit[]>([])

  useEffect(() => {
    async function fetchHabits() {
      if (habitIds.length === 0) {
        setHabits([])
        return
      }

      try {
        const results = await iotaClient.multiGetObjects({
          ids: habitIds,
          options: { showContent: true, showOwner: true }
        })

        const loadedHabits = results
          .map(data => data.data ? getHabitFields(data.data) : null)
          .filter((h): h is Habit => h !== null)

        setHabits(loadedHabits)
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
      }
    }

    fetchHabits()
  }, [habitIds, iotaClient])

  // Calculate Aggregates
  const totalHabits = habits.length
  const totalCheckins = habits.reduce((sum, h) => sum + h.totalCheckins, 0)

  // Current Streak: Max current streak across all habits
  const topCurrentStreak = habits.reduce((max, h) => Math.max(max, h.currentStreak), 0)

  // Longest Streak: Max longest streak across all habits
  const topLongestStreak = habits.reduce((max, h) => Math.max(max, h.longestStreak), 0)

  // Active Habits: Habits checked in TODAY
  const completedToday = habits.filter(h => {
    if (!h.lastCheckinDate) return false
    return isSameDay(h.lastCheckinDate, Date.now())
  }).length

  // Completion Rate: (Completed Today / Total) * 100
  const completionRate = totalHabits > 0
    ? Math.round((completedToday / totalHabits) * 100)
    : 0

  return (
    <Card style={{ padding: "1.5rem", marginBottom: "2rem" }}>
      <Heading size="6" style={{ marginBottom: "1.5rem" }}>Statistics</Heading>

      <Flex gap="4" wrap="wrap">
        <Flex direction="column" gap="1" style={{ minWidth: "150px" }}>
          <Text size="2" color="gray">Total Habits</Text>
          <Text size="7" weight="bold">{totalHabits}</Text>
        </Flex>

        <Flex direction="column" gap="1" style={{ minWidth: "150px" }}>
          <Text size="2" color="gray">Total Check-ins</Text>
          <Text size="7" weight="bold">{totalCheckins}</Text>
        </Flex>

        <Flex direction="column" gap="1" style={{ minWidth: "150px" }}>
          <Text size="2" color="gray">Current Streak</Text>
          <Text size="7" weight="bold">🔥 {topCurrentStreak}</Text>
        </Flex>

        <Flex direction="column" gap="1" style={{ minWidth: "150px" }}>
          <Text size="2" color="gray">Longest Streak</Text>
          <Text size="7" weight="bold">{topLongestStreak}</Text>
        </Flex>

        <Flex direction="column" gap="1" style={{ minWidth: "150px" }}>
          <Text size="2" color="gray">Completed Today</Text>
          <Text size="7" weight="bold">{completedToday}/{totalHabits}</Text>
        </Flex>

        <Flex direction="column" gap="1" style={{ minWidth: "150px" }}>
          <Text size="2" color="gray">Completion Rate</Text>
          <Text size="7" weight="bold">{completionRate}%</Text>
        </Flex>
      </Flex>
    </Card>
  )
}
