import random


class SystemPlayer:
    def __init__(self):
        self.possible_numbers = set(f"{i:04d}" for i in range(10000))
        self.guessed_numbers = set()

    def validate_guess(self, guess, answer):
        if not guess or not answer:
            return {'correct_digits': 0, 'correct_positions': 0}

        guess_str = str(guess).zfill(4)
        answer_str = str(answer).zfill(4)

        correct_positions = 0
        correct_digits = 0

        for i in range(4):
            if guess_str[i] == answer_str[i]:
                correct_positions += 1

        guess_digits = {}
        answer_digits = {}

        for digit in guess_str:
            guess_digits[digit] = guess_digits.get(digit, 0) + 1

        for digit in answer_str:
            answer_digits[digit] = answer_digits.get(digit, 0) + 1

        for digit in guess_digits:
            if digit in answer_digits:
                correct_digits += min(guess_digits[digit], answer_digits[digit])

        return {'correct_digits': correct_digits, 'correct_positions': correct_positions}

    def make_intelligent_guess(self, previous_guesses):
        if not previous_guesses:
            return "1234"

        valid_numbers = []

        for number in self.possible_numbers:
            if number in self.guessed_numbers:
                continue

            is_valid = True
            for prev_guess in previous_guesses:
                guess = prev_guess['guess']
                expected_result = self.validate_guess(guess, number)
                actual_result = {
                    'correct_digits': prev_guess['correct_digits'],
                    'correct_positions': prev_guess['correct_positions']
                }

                if expected_result != actual_result:
                    is_valid = False
                    break

            if is_valid:
                valid_numbers.append(number)

        if valid_numbers:
            return random.choice(valid_numbers)
        else:
            available = [n for n in self.possible_numbers if n not in self.guessed_numbers]
            return random.choice(available) if available else "0000"

    def add_guess(self, guess):
        self.guessed_numbers.add(str(guess).zfill(4))


# Shared dict of active system player instances, keyed by game_id
system_players = {}
