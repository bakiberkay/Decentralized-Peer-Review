import numpy as np
import plotly.graph_objects as go

# Adjusted gain summand formula with correct alpha usage
def gain_summand(alpha, x, active_time, max_active_time):
    gain_factor = (1 / (max_active_time/max_gain_adjuster))  # Ensure 1 + (1/( maxActiveTime/2)) * maxActiveTime = 3
    #print ("max_active_time: ", max_active_time)
    #print ("max_gain_adjuster: ", max_gain_adjuster)
    #print ("bölen: ", max_active_time/max_gain_adjuster)
    #print("Gain Factor: ", gain_factor)
    #print ("Active Time: ", active_time)
    #print ("Multiplier:" , 1 + (active_time * gain_factor))
    return (1 / alpha) * (4 * x * (1 - x)) * (1 + (active_time * gain_factor))

# Reputation progression function
def simulate_reputation_growth(alpha, max_active_time, intervals_per_year, total_years):
    reputation = 0.5  # Initial reputation
    reputation_progress = [reputation]

    for interval in range(intervals_per_year * total_years):
        x = reputation  # Current reputation scaled to [0, 1]
        active_time = min(interval , max_active_time)  # Increment active time FIXED NOW
        #print(active_time)
        gain = gain_summand(alpha, x, active_time, max_active_time)
        reputation += gain
        #print("ActiveTime:" , active_time , "Gain:", gain , "Reputation: ", reputation)
        reputation = min(reputation, 1.0)  # Cap reputation at 1.0
        reputation_progress.append(reputation)

    return reputation_progress

# Parameters
alphas = [20, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]  # Different alpha values to analyze
alphas = [150,200]
#max_active_times = [6, 12, 20, 24, 26, 52, 60]  # Adjusted active time cap
#max_active_times = [6, 12, 24, 26, 30, 36, 48, 60, 52, 104]  # Adjusted active time cap for MONTHLY
#max_active_times = [24, 30, 36, 48, 60]
#max_active_times = [26, 52, 65, 78, 104, 130] #biweekly 1 ,2, 2.5, 3, 4, 5 years
max_active_times = [30 , 60] #weekly 0.5, 1 ,2, 2.5, 3, 4, 5 years
#max_gain_adjusters = [1, 1.5, 2] 
max_gain_adjusters = [2]
#intervals = {"Weekly": 52, "Biweekly": 26, "Monthly": 12, "Quarterly": 4, "Annually": 1}
#intervals = {"Biweekly": 26}
intervals = {"Monthly": 12}
total_years = 5  # 5-year goal

# Create an interactive plot
fig = go.Figure()

for interval_name, intervals_per_year in intervals.items():
    time_scale = np.linspace(0, total_years, intervals_per_year * total_years + 1)  # Adjust x-axis resolution
    for alpha in alphas:
        for max_active_time in max_active_times:
            for max_gain_adjuster in max_gain_adjusters:
                reputation_growth = simulate_reputation_growth(alpha, max_active_time, intervals_per_year, total_years)
                fig.add_trace(go.Scatter(
                    x=time_scale * 12,  # Convert years to months for x-axis
                    y=reputation_growth,
                    mode='lines',
                    name=f"{interval_name} - Alpha {alpha} - Max Active Time {max_active_time} - Max Gain {max_gain_adjuster+1}",
                ))

# Update layout for better visualization
fig.update_layout(
    title="Reputation Progression Over 5 Years (Monthly Resolution)",
    xaxis_title="Time (Months)",
    yaxis_title="Reputation",
    legend_title="Interval and Alpha",
    hovermode="x unified",
    xaxis=dict(tickmode='linear', tick0=0, dtick=6)  # Tick every 6 months
)

# Show the interactive plot
fig.show()

# Function to calculate the steepest slope for each function and find the closest to the target point (y=0.75, x=30)
def find_steepest_slopes(results, time_scale, target_reputation=0.75, target_time=30):
    steepest_points = []

    for interval_name, intervals_per_year in intervals.items():
        time_scale = np.linspace(0, total_years, intervals_per_year * total_years + 1)  # Adjust x-axis resolution
        for alpha in alphas:
            for max_active_time in max_active_times:
                for max_gain_adjuster in max_gain_adjusters:
                    # Simulate reputation growth
                    reputation_growth = simulate_reputation_growth(alpha, max_active_time, intervals_per_year, total_years)
                    
                    # Find steepest slope and corresponding time/reputation
                    max_slope = 0
                    max_slope_time = 0
                    max_slope_reputation = 0

                    for i in range(1, len(reputation_growth)):
                        slope = (reputation_growth[i] - reputation_growth[i - 1]) / (time_scale[i] - time_scale[i - 1])
                        if slope > max_slope:
                            max_slope = slope
                            max_slope_time = time_scale[i] * 12  # Convert years to months for x-axis
                            max_slope_reputation = reputation_growth[i]
                    
                    # Store results
                    steepest_points.append({
                        "Interval": interval_name,
                        "Alpha": alpha,
                        "Max Active Time": max_active_time,
                        "Max Gain Adjuster": max_gain_adjuster,
                        "Steepest Slope": max_slope,
                        "Time (Months)": max_slope_time,
                        "Reputation": max_slope_reputation,
                        "Distance to Target": abs(max_slope_reputation - target_reputation) + abs(max_slope_time - target_time)
                    })

    # Sort by distance to the target point
    sorted_points = sorted(steepest_points, key=lambda x: x["Distance to Target"])
    return sorted_points[:10]  # Return the top 10 closest points

# Perform the analysis
steepest_results = find_steepest_slopes(results=[], time_scale=[], target_reputation=0.75, target_time=30)

# Display the top results
import pandas as pd
df_steepest = pd.DataFrame(steepest_results)
print("Top Configurations by Steepest Slope Near Target Point")
print(df_steepest)
