"use client"

import { Flex, Heading, Text, Button } from "@radix-ui/themes"
import { HabitCard } from "./HabitCard"
import { CreateHabitModal } from "./CreateHabitModal"
import { useState } from "react"
import { useHabit } from "@/hooks/useHabit"
import type { Habit } from "@/types/habit"
import ClipLoader from "react-spinners/ClipLoader"

interface HabitListProps {
  habitIds: string[]
  onHabitCreated?: (habitId: string) => void
}

export function HabitList({ habitIds, onHabitCreated }: HabitListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { actions } = useHabit() // Don't use state here, it's for creating habits only

  const handleCreateHabit = async (input: any) => {
    try {
      const habitId = await actions.createHabit(input)
      if (habitId) {
        onHabitCreated?.(habitId)
        setShowCreateModal(false)
      }
    } catch (error) {
      console.error("Error creating habit:", error)
      // Error will be shown in the modal
    }
  }

  if (habitIds.length === 0) {
    return (
      <Flex direction="column" align="center" gap="4" style={{ padding: "3rem" }}>
        <Text size="5" color="gray">No habits yet</Text>
        <Text size="2" color="gray" align="center">
          Create your first habit to start tracking your progress on-chain!
        </Text>
        <Button size="3" onClick={() => setShowCreateModal(true)}>
          Create Your First Habit
        </Button>
        {showCreateModal && (
          <CreateHabitModal
            onCreate={handleCreateHabit}
            onClose={() => setShowCreateModal(false)}
          />
        )}
      </Flex>
    )
  }

  return (
    <>
      <Flex direction="column" gap="3">
        <Flex justify="between" align="center">
          <Heading size="6">My Habits</Heading>
          <Button onClick={() => setShowCreateModal(true)}>
            + New Habit
          </Button>
        </Flex>

        {/* Note: In a real app, you'd fetch all habits and render them */}
        <Text size="2" color="gray">
          {habitIds.length} habit{habitIds.length !== 1 ? "s" : ""} found
        </Text>
      </Flex>

      {showCreateModal && (
        <CreateHabitModal
          onCreate={handleCreateHabit}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </>
  )
}

