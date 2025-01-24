import pandas as pd
import matplotlib.pyplot as plt

# Load the Excel file
file_path = './User1.xlsx'
data = pd.read_excel(file_path, header=None)


fault_possibilities = data.iloc[:, 0]  
reputation_data = data.iloc[:, 1:]  


# Colorblind-friendly colors
hex_colors = ['#EE7733', '#0077BB', '#33BBEE', '#EE3377', '#CCBB44', '#009988', '#CC3311' , '#000000']


# Plotting the data
plt.figure(figsize=(12, 8))
for idx, (fault, color) in enumerate(zip(fault_possibilities, hex_colors)):
    fault_label = f"${fault:.2f}$"
    plt.plot(reputation_data.columns, reputation_data.iloc[idx], label=fault_label, linestyle = '-', color=color, linewidth=1.5)

# Styling the plot
plt.title("Reputation Progression, Subtractive Method, γ = 5", fontsize=26) # γ gamma
plt.xlabel("Intervals", fontsize=24)
plt.ylabel("Reputation", fontsize=24)
plt.legend(title="Fault\nProbability", fontsize=18, title_fontsize = 18, loc='upper left', bbox_to_anchor=(1, 1))
plt.grid(True)

plt.ylim(0, 1e6)  # y-axis range
plt.ticklabel_format(axis='y', style='scientific', scilimits=(0, 0))  # scientific notation e6

plt.xticks(fontsize=16)
plt.yticks(fontsize=16)

plt.tight_layout()

plt.savefig("reputation_progression.png", dpi=500)
plt.show()
