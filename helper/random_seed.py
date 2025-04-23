import random

def generate_random_seed() -> int:
    return random.randint(100_000_000_000_000, 999_999_999_999_999)