"use client"

import { HabitCard } from "./HabitCard"
import { useHabit } from "@/hooks/useHabit"
import ClipLoader from "react-spinners/ClipLoader"
import { Text } from "@radix-ui/themes"

interface HabitCardWrapperProps {
  habitId: string
  onCheckIn?: () => void
  onDelete?: () => void
}

export function HabitCardWrapper({ habitId, onCheckIn, onDelete }: HabitCardWrapperProps) {
  const { habit, state } = useHabit(habitId)

  if (state.isLoading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <ClipLoader />
      </div>
    )
  }

  if (!habit) {
    return (
      <Text size="2" color="gray">
        Habit not found: {habitId}
      </Text>
    )
  }

  return (
    <HabitCard
      habit={habit}
      onCheckIn={onCheckIn}
      onDelete={onDelete}
    />
  )
}

