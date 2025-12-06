"use client"

import { useState } from "react"
import { Dialog, Button, TextArea, Flex, Text } from "@radix-ui/themes"
import type { Habit } from "@/types/habit"

interface CheckInModalProps {
  habit: Habit
  onCheckIn: (notes?: string) => Promise<void>
  onClose: () => void
}

export function CheckInModal({ habit, onCheckIn, onClose }: CheckInModalProps) {
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onCheckIn(notes || undefined)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog.Root open={true} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content style={{ maxWidth: "500px" }}>
        <Dialog.Title>
          Check In: {habit.emoji} {habit.name}
        </Dialog.Title>
        
        <Dialog.Description>
          Record your progress for today. You can add optional notes about your activity.
        </Dialog.Description>

        <Flex direction="column" gap="3" style={{ marginTop: "1rem" }}>
          <Flex direction="column" gap="1">
            <Text size="2" weight="bold">Notes (optional)</Text>
            <TextArea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did it go? What did you do?"
              rows={4}
            />
          </Flex>

          <Flex gap="2" justify="end" style={{ marginTop: "1rem" }}>
            <Button
              variant="soft"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              color="green"
            >
              {isSubmitting ? "Checking In..." : "Check In"}
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  )
}

