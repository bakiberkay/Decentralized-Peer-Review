import matplotlib.pyplot as plt
import numpy as np

# Define the formula for the gain summand
def gain_summand(alpha, x, active_time):
    return alpha * (4 * x * (1_000_000 - x)) * (1_000_000 + (active_time * 1_000_000 / 10))

# Parameters
alphas = [200, 300, 400, 500]  # Different alpha values to analyze
active_time = 20  # Maximum active time
x_values = np.linspace(0, 1_000_000, 100)  # Reputation values from 0 to 1,000,000
scaling_factor = 1_000_000  # Ignore scaling in conceptual analysis

# Simulate gain summands for different alpha values
results = {}
for alpha in alphas:
    results[alpha] = [gain_summand(alpha, x, active_time) / scaling_factor**3 for x in x_values]

# Plot the dynamics
plt.figure(figsize=(10, 6))
for alpha, gains in results.items():
    plt.plot(x_values / 1_000_000, gains, label=f"Alpha = {alpha}")

plt.title("Gain Summand Dynamics Across Reputation Levels", fontsize=14)
plt.xlabel("Reputation (Scaled)", fontsize=12)
plt.ylabel("Gain Summand Contribution", fontsize=12)
plt.legend()
plt.grid()
plt.show()
