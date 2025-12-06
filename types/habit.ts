/**
 * TypeScript types for On-chain Habit Tracker
 * These types match the Move contract structures
 */

export type GoalType = 'daily' | 'weekly' | 'monthly'

export const GOAL_TYPE_MAP = {
  0: 'daily' as const,
  1: 'weekly' as const,
  2: 'monthly' as const,
} as const

export interface Habit {
  id: string
  owner: string
  name: string
  description: string
  emoji: string
  createdAt: number
  goalType: GoalType
  goalTypeRaw: number // 0=daily, 1=weekly, 2=monthly
  goalCount: number
  totalCheckins: number
  currentStreak: number
  longestStreak: number
  lastCheckinDate: number | null
  isPublic: boolean
}

export interface CheckIn {
  id: string
  habitId: string
  date: number
  notes?: string
}

export interface HabitStats {
  completionRate: number // 0-100
  daysSinceCreation: number
  weeklyProgress: number[]
  monthlyProgress: number[]
  streakHistory: StreakRecord[]
}

export interface StreakRecord {
  date: number
  streak: number
}

export interface CreateHabitInput {
  name: string
  description: string
  emoji: string
  goalType: GoalType
  goalCount: number
  isPublic: boolean
}

export interface UpdateHabitInput {
  name?: string
  description?: string
  emoji?: string
  goalType?: GoalType
  goalCount?: number
  isPublic?: boolean
}

export interface CheckInInput {
  notes?: string
}

/**
 * Helper function to convert goal type string to number
 */
export function goalTypeToNumber(goalType: GoalType): number {
  switch (goalType) {
    case 'daily':
      return 0
    case 'weekly':
      return 1
    case 'monthly':
      return 2
    default:
      return 0
  }
}

/**
 * Helper function to convert goal type number to string
 */
export function goalTypeToString(goalTypeRaw: number): GoalType {
  return GOAL_TYPE_MAP[goalTypeRaw as keyof typeof GOAL_TYPE_MAP] || 'daily'
}

/**
 * Helper function to format date timestamp to readable date
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Helper function to get start of day timestamp
 */
export function getStartOfDay(timestamp: number): number {
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

/**
 * Helper function to check if two timestamps are on the same day
 */
export function isSameDay(timestamp1: number, timestamp2: number): boolean {
  return getStartOfDay(timestamp1) === getStartOfDay(timestamp2)
}

/**
 * Helper function to get days between two timestamps
 */
export function getDaysBetween(timestamp1: number, timestamp2: number): number {
  const diff = Math.abs(timestamp2 - timestamp1)
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

