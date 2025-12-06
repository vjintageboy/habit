"use client"

import { Button, Card, Flex, Heading, Text, Badge } from "@radix-ui/themes"
import { useHabit } from "@/hooks/useHabit"
import type { Habit } from "@/types/habit"
import ClipLoader from "react-spinners/ClipLoader"
import { useState } from "react"
import { CheckInModal } from "./CheckInModal"
import { EditHabitModal } from "./EditHabitModal"
import { AlertDialog } from "@radix-ui/themes"

interface HabitCardProps {
  habit: Habit
  onCheckIn?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function HabitCard({ habit, onCheckIn, onEdit, onDelete }: HabitCardProps) {
  const { actions, state, isOwner } = useHabit(habit.id)
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const canCheckInToday = habit.lastCheckinDate
    ? new Date().setHours(0, 0, 0, 0) !== new Date(habit.lastCheckinDate).setHours(0, 0, 0, 0)
    : true

  const handleCheckIn = async (notes?: string) => {
    await actions.checkIn(habit.id, { notes })
    setShowCheckInModal(false)
    onCheckIn?.()
  }

  const handleUpdate = async (input: any) => {
    await actions.updateHabit(habit.id, input)
    setIsEditing(false)
    onEdit?.()
  }

  const handleDelete = async () => {
    await actions.deleteHabit(habit.id)
    setIsDeleting(false)
    onDelete?.()
  }

  const completionRate = habit.totalCheckins > 0 && habit.goalCount > 0
    ? Math.min(100, Math.round((habit.totalCheckins / (habit.goalCount * 30)) * 100))
    : 0

  return (
    <>
      <Card style={{ padding: "1.5rem", marginBottom: "1rem" }}>
        <Flex direction="column" gap="3">
          {/* Header */}
          <Flex align="center" justify="between">
            <Flex align="center" gap="2">
              <Text size="6">{habit.emoji}</Text>
              <Heading size="5">{habit.name}</Heading>
            </Flex>
            {habit.isPublic && (
              <Badge color="blue" variant="soft">Public</Badge>
            )}
          </Flex>

          {/* Description */}
          {habit.description && (
            <Text size="2" color="gray">
              {habit.description}
            </Text>
          )}

          {/* Stats */}
          <Flex gap="4" wrap="wrap">
            <Flex direction="column" gap="1">
              <Text size="1" color="gray">Current Streak</Text>
              <Flex align="center" gap="1">
                <Text size="5" weight="bold">🔥 {habit.currentStreak}</Text>
                <Text size="2" color="gray">days</Text>
              </Flex>
            </Flex>

            <Flex direction="column" gap="1">
              <Text size="1" color="gray">Longest Streak</Text>
              <Text size="5" weight="bold">{habit.longestStreak}</Text>
            </Flex>

            <Flex direction="column" gap="1">
              <Text size="1" color="gray">Total Check-ins</Text>
              <Text size="5" weight="bold">{habit.totalCheckins}</Text>
            </Flex>

            <Flex direction="column" gap="1">
              <Text size="1" color="gray">Goal</Text>
              <Text size="3">{habit.goalType} × {habit.goalCount}</Text>
            </Flex>
          </Flex>

          {/* Progress Bar */}
          <Flex direction="column" gap="1">
            <Flex justify="between" align="center">
              <Text size="2" color="gray">Completion Rate</Text>
              <Text size="2" weight="bold">{completionRate}%</Text>
            </Flex>
            <div
              style={{
                width: "100%",
                height: "8px",
                backgroundColor: "var(--gray-a5)",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${completionRate}%`,
                  height: "100%",
                  backgroundColor: "var(--green-9)",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </Flex>

          {/* Actions */}
          <Flex gap="2" wrap="wrap">
            <Button
              onClick={() => setShowCheckInModal(true)}
              disabled={!canCheckInToday || state.isPending}
              color={canCheckInToday ? "green" : "gray"}
              variant="solid"
            >
              {state.isPending ? (
                <>
                  <ClipLoader size={14} />
                  <span style={{ marginLeft: "8px" }}>Processing...</span>
                </>
              ) : canCheckInToday ? (
                "✓ Check In"
              ) : (
                "Already Checked In"
              )}
            </Button>

            {isOwner && (
              <>
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="soft"
                  disabled={state.isPending}
                >
                  Edit
                </Button>

                <AlertDialog.Root open={isDeleting} onOpenChange={setIsDeleting}>
                  <AlertDialog.Trigger>
                    <Button
                      color="red"
                      variant="soft"
                      disabled={state.isPending}
                    >
                      Delete
                    </Button>
                  </AlertDialog.Trigger>
                  <AlertDialog.Content style={{ maxWidth: 450 }}>
                    <AlertDialog.Title>Delete Habit</AlertDialog.Title>
                    <AlertDialog.Description size="2">
                      Are you sure? This action cannot be undone. All check-in history for "<strong>{habit.name}</strong>" will be permanently lost.
                    </AlertDialog.Description>

                    <Flex gap="3" mt="4" justify="end">
                      <AlertDialog.Cancel>
                        <Button variant="soft" color="gray">
                          Cancel
                        </Button>
                      </AlertDialog.Cancel>
                      <AlertDialog.Action>
                        <Button variant="solid" color="red" onClick={handleDelete}>
                          Yes, Delete Habit
                        </Button>
                      </AlertDialog.Action>
                    </Flex>
                  </AlertDialog.Content>
                </AlertDialog.Root>
              </>
            )}
          </Flex>

          {state.error && (
            <Text size="2" color="red">
              Error: {state.error.message}
            </Text>
          )}
        </Flex>
      </Card>

      {showCheckInModal && (
        <CheckInModal
          habit={habit}
          onCheckIn={handleCheckIn}
          onClose={() => setShowCheckInModal(false)}
        />
      )}

      {isEditing && (
        <EditHabitModal
          habit={habit}
          onUpdate={handleUpdate}
          onClose={() => setIsEditing(false)}
        />
      )}
    </>
  )
}

