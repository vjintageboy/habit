// Copyright (c) 2024 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/// On-chain Habit Tracker Contract
/// 
/// Features:
/// - Create habits with name, description, emoji, goals
/// - Check in daily for habits
/// - Track streaks (consecutive days)
/// - Update/delete habits (owner only)
/// - Public/private visibility

module habit::contract {
    use iota::object::{Self, UID, ID};
    use iota::tx_context::{Self, TxContext};
    use iota::transfer;
    use iota::event;
    use std::string::{Self, String};
    use std::option;

    // ============================================================
    // CONSTANTS
    // ============================================================

    const E_ALREADY_CHECKED_IN: u64 = 1;
    const E_NOT_OWNER: u64 = 2;
    const E_INVALID_DATE: u64 = 3;
    const E_INVALID_GOAL_TYPE: u64 = 4;

    const GOAL_TYPE_MONTHLY: u8 = 2;

    const MS_PER_DAY: u64 = 86400000; // 24 * 60 * 60 * 1000

    // ============================================================
    // DATA STRUCTURES
    // ============================================================

    /// Main habit object - shared object that anyone can interact with
    public struct Habit has key {
        id: UID,
        owner: address,
        name: String,
        description: String,
        emoji: String,              // Emoji icon (e.g., "🏃", "📚")
        created_at: u64,            // Timestamp when created
        goal_type: u8,              // 0=daily, 1=weekly, 2=monthly
        goal_count: u64,            // Target count per period
        total_checkins: u64,        // Total check-ins ever
        current_streak: u64,        // Current consecutive days
        longest_streak: u64,        // Best streak ever achieved
        last_checkin_date: Option<u64>, // Last check-in date (start of day timestamp)
        is_public: bool,            // Public visibility
    }

    /// Check-in record - owned object by the user
    public struct CheckIn has key {
        id: UID,
        habit_id: ID,               // Reference to Habit
        date: u64,                  // Date timestamp (start of day)
        notes: Option<String>,       // Optional notes
    }

    // ============================================================
    // EVENTS
    // ============================================================

    public struct HabitCreated has copy, drop {
        habit_id: ID,
        owner: address,
        name: String,
    }

    public struct CheckInRecorded has copy, drop {
        habit_id: ID,
        date: u64,
        new_streak: u64,
        total_checkins: u64,
    }

    public struct StreakBroken has copy, drop {
        habit_id: ID,
        previous_streak: u64,
    }

    public struct HabitUpdated has copy, drop {
        habit_id: ID,
    }

    public struct HabitDeleted has copy, drop {
        habit_id: ID,
    }

    // ============================================================
    // PUBLIC FUNCTIONS
    // ============================================================

    /// Create a new habit
    /// Anyone can create a habit
    public entry fun create_habit(
        name: vector<u8>,
        description: vector<u8>,
        emoji: vector<u8>,
        goal_type: u8,
        goal_count: u64,
        is_public: bool,
        ctx: &mut TxContext
    ): ID {
        // Validate goal type
        assert!(goal_type <= GOAL_TYPE_MONTHLY, E_INVALID_GOAL_TYPE);

        let habit = Habit {
            id: object::new(ctx),
            owner: ctx.sender(),
            name: string::utf8(name),
            description: string::utf8(description),
            emoji: string::utf8(emoji),
            created_at: tx_context::epoch_timestamp_ms(ctx),
            goal_type,
            goal_count,
            total_checkins: 0,
            current_streak: 0,
            longest_streak: 0,
            last_checkin_date: option::none(),
            is_public,
        };

        let habit_id = object::id(&habit);
        transfer::share_object(habit);

        event::emit(HabitCreated {
            habit_id,
            owner: ctx.sender(),
            name: string::utf8(name),
        });

        habit_id
    }

    /// Check in for a habit
    /// Anyone can check in (for public habits) or owner (for private)
    public entry fun check_in(
        habit: &mut Habit,
        notes: vector<u8>,  // Simplified: use vector<u8> directly, empty vector = no notes
        ctx: &mut TxContext
    ) {
        let now = tx_context::epoch_timestamp_ms(ctx);
        let today = get_date_timestamp(now);

        // Check if already checked in today
        if (option::is_some(&habit.last_checkin_date)) {
            let last_date = *option::borrow(&habit.last_checkin_date);
            assert!(last_date != today, E_ALREADY_CHECKED_IN);
        };

        let yesterday = today - MS_PER_DAY;

        // Update streak logic
        if (option::is_some(&habit.last_checkin_date)) {
            let last_date = *option::borrow(&habit.last_checkin_date);
            if (last_date == yesterday) {
                // Consecutive day - increment streak
                habit.current_streak = habit.current_streak + 1;
            } else if (last_date < yesterday) {
                // Streak broken - reset and update longest
                if (habit.current_streak > habit.longest_streak) {
                    habit.longest_streak = habit.current_streak;
                };
                let previous_streak = habit.current_streak;
                habit.current_streak = 1;
                
                event::emit(StreakBroken {
                    habit_id: object::id(habit),
                    previous_streak,
                });
            } else {
                // Future date or same day - shouldn't happen
                abort E_INVALID_DATE
            }
        } else {
            // First check-in ever
            habit.current_streak = 1;
        };

        // Update habit statistics
        habit.total_checkins = habit.total_checkins + 1;
        habit.last_checkin_date = option::some(today);

        // Update longest streak if current is better
        if (habit.current_streak > habit.longest_streak) {
            habit.longest_streak = habit.current_streak;
        };

        // Create check-in record
        let notes_option = if (vector::length(&notes) > 0) {
            option::some(string::utf8(notes))
        } else {
            option::none()
        };
        
        let checkin = CheckIn {
            id: object::new(ctx),
            habit_id: object::id(habit),
            date: today,
            notes: notes_option,
        };
        transfer::transfer(checkin, ctx.sender());

        event::emit(CheckInRecorded {
            habit_id: object::id(habit),
            date: today,
            new_streak: habit.current_streak,
            total_checkins: habit.total_checkins,
        });
    }

    /// Update habit information (only owner)
    public entry fun update_habit(
        habit: &mut Habit,
        name: Option<String>,
        description: Option<String>,
        emoji: Option<String>,
        goal_type: Option<u8>,
        goal_count: Option<u64>,
        is_public: Option<bool>,
        ctx: &TxContext
    ) {
        assert!(habit.owner == ctx.sender(), E_NOT_OWNER);

        if (option::is_some(&name)) {
            habit.name = *option::borrow(&name);
        };
        if (option::is_some(&description)) {
            habit.description = *option::borrow(&description);
        };
        if (option::is_some(&emoji)) {
            habit.emoji = *option::borrow(&emoji);
        };
        if (option::is_some(&goal_type)) {
            let gt = *option::borrow(&goal_type);
            assert!(gt <= GOAL_TYPE_MONTHLY, E_INVALID_GOAL_TYPE);
            habit.goal_type = gt;
        };
        if (option::is_some(&goal_count)) {
            habit.goal_count = *option::borrow(&goal_count);
        };
        if (option::is_some(&is_public)) {
            habit.is_public = *option::borrow(&is_public);
        };

        event::emit(HabitUpdated {
            habit_id: object::id(habit),
        });
    }

    /// Delete a habit (only owner)
    public entry fun delete_habit(habit: Habit, ctx: &TxContext) {
        assert!(habit.owner == ctx.sender(), E_NOT_OWNER);
        
        let habit_id = object::id(&habit);
        let Habit { id, .. } = habit;
        object::delete(id);

        event::emit(HabitDeleted {
            habit_id,
        });
    }

    // ============================================================
    // VIEW FUNCTIONS (read-only)
    // ============================================================

    /// Get all habit information
    public fun get_habit_info(habit: &Habit): (
        address,
        String,
        String,
        String,
        u64,
        u8,
        u64,
        u64,
        u64,
        u64,
        bool
    ) {
        (
            habit.owner,
            habit.name,
            habit.description,
            habit.emoji,
            habit.created_at,
            habit.goal_type,
            habit.goal_count,
            habit.total_checkins,
            habit.current_streak,
            habit.longest_streak,
            habit.is_public,
        )
    }

    /// Get completion rate for a period (percentage)
    /// period_days: number of days to calculate rate for
    public fun get_completion_rate(habit: &Habit, period_days: u64): u64 {
        if (habit.total_checkins == 0 || period_days == 0) {
            return 0
        };
        
        let expected = period_days * habit.goal_count;
        if (expected == 0) {
            return 0
        };
        
        // Calculate percentage (multiply by 100 for percentage)
        let rate = (habit.total_checkins * 100) / expected;
        
        // Cap at 100%
        if (rate > 100) {
            100
        } else {
            rate
        }
    }

    /// Check if user can check in today
    public fun can_check_in_today(habit: &Habit, ctx: &TxContext): bool {
        let now = tx_context::epoch_timestamp_ms(ctx);
        let today = get_date_timestamp(now);
        
        if (option::is_some(&habit.last_checkin_date)) {
            let last_date = *option::borrow(&habit.last_checkin_date);
            last_date != today
        } else {
            true // Never checked in
        }
    }

    // ============================================================
    // HELPER FUNCTIONS
    // ============================================================

    /// Get date timestamp (start of day in milliseconds)
    /// This is a simplified version - in production, use proper date library
    fun get_date_timestamp(timestamp_ms: u64): u64 {
        // Round down to nearest day (midnight)
        timestamp_ms - (timestamp_ms % MS_PER_DAY)
    }

    /// Get days since creation
    public fun get_days_since_creation(habit: &Habit, ctx: &TxContext): u64 {
        let now = tx_context::epoch_timestamp_ms(ctx);
        let created = get_date_timestamp(habit.created_at);
        let current = get_date_timestamp(now);
        
        if (current < created) {
            return 0
        };
        
        (current - created) / MS_PER_DAY
    }
}
