"use client"

import { Dialog, Button, TextField, TextArea, Flex, Text, Select, Switch, Callout } from "@radix-ui/themes"
import { useState } from "react"
import type { Habit, UpdateHabitInput, GoalType } from "@/types/habit"

interface EditHabitModalProps {
    habit: Habit
    onUpdate: (input: UpdateHabitInput) => Promise<void>
    onClose: () => void
}

export function EditHabitModal({ habit, onUpdate, onClose }: EditHabitModalProps) {
    const [name, setName] = useState(habit.name)
    const [description, setDescription] = useState(habit.description)
    const [emoji, setEmoji] = useState(habit.emoji)
    const [goalType, setGoalType] = useState<GoalType>(habit.goalType as GoalType) // Ensure type match
    const [goalCount, setGoalCount] = useState(habit.goalCount)
    const [isPublic, setIsPublic] = useState(habit.isPublic)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Mapping for Select value validation to avoid potential mismatches
    const validGoalTypes: GoalType[] = ["daily", "weekly", "monthly"]
    const currentGoalType = validGoalTypes.includes(goalType) ? goalType : "daily"

    const handleSubmit = async () => {
        if (!name.trim()) return

        setIsSubmitting(true)
        setError(null)
        try {
            await onUpdate({
                // Only include fields if they changed or are needed
                name: name.trim(),
                description: description.trim(),
                emoji: emoji.trim() || "📝",
                goalType,
                goalCount,
                isPublic,
            })
            onClose()
        } catch (error) {
            console.error("Error updating habit:", error)
            const errorMessage = error instanceof Error ? error.message : "Failed to update habit"
            setError(errorMessage)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog.Root open={true} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Content style={{ maxWidth: "600px" }}>
                <Dialog.Title>Edit Habit</Dialog.Title>

                <Dialog.Description>
                    Update your habit details.
                </Dialog.Description>

                <Flex direction="column" gap="3" style={{ marginTop: "1.5rem" }}>
                    <Flex direction="column" gap="1">
                        <Text size="2" weight="bold">Emoji Icon</Text>
                        <TextField.Root
                            value={emoji}
                            onChange={(e) => setEmoji(e.target.value)}
                            placeholder="📝"
                            maxLength={2}
                            style={{ width: "80px" }}
                        />
                    </Flex>

                    <Flex direction="column" gap="1">
                        <Text size="2" weight="bold">Name *</Text>
                        <TextField.Root
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Morning Run, Read Books"
                            required
                        />
                    </Flex>

                    <Flex direction="column" gap="1">
                        <Text size="2" weight="bold">Description</Text>
                        <TextArea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What is this habit about?"
                            rows={3}
                        />
                    </Flex>

                    <Flex gap="3">
                        <Flex direction="column" gap="1" style={{ flex: 1 }}>
                            <Text size="2" weight="bold">Goal Type</Text>
                            <Select.Root
                                value={currentGoalType}
                                onValueChange={(value) => setGoalType(value as GoalType)}
                            >
                                <Select.Trigger />
                                <Select.Content>
                                    <Select.Item value="daily">Daily</Select.Item>
                                    <Select.Item value="weekly">Weekly</Select.Item>
                                    <Select.Item value="monthly">Monthly</Select.Item>
                                </Select.Content>
                            </Select.Root>
                        </Flex>

                        <Flex direction="column" gap="1" style={{ flex: 1 }}>
                            <Text size="2" weight="bold">Goal Count</Text>
                            <TextField.Root
                                type="number"
                                value={goalCount}
                                onChange={(e) => setGoalCount(Math.max(1, parseInt(e.target.value) || 1))}
                                min={1}
                            />
                        </Flex>
                    </Flex>

                    <Flex align="center" gap="2">
                        <Switch
                            checked={isPublic}
                            onCheckedChange={setIsPublic}
                        />
                        <Text size="2">Make this habit public</Text>
                    </Flex>

                    {error && (
                        <Callout.Root color="red" style={{ marginTop: "1rem" }}>
                            <Callout.Text>
                                {error}
                            </Callout.Text>
                        </Callout.Root>
                    )}

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
                            disabled={isSubmitting || !name.trim()}
                        >
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </Flex>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    )
}
