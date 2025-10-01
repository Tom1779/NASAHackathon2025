import turtle, random, time

# Ohio turtle setup (absolutely diabolical) 
sigma = turtle.Turtle()
sigma.shape("turtle")
sigma.speed(0)
sigma.pensize(3)

# Skibidi color palette
rizz_colors = ["#FF6B35", "#F7931E", "#FFD23F", "#06FFA5", "#4ECDC4", "#45B7D1"]

def tung_tung_animation():
    """Peak brainrot: turtle goes absolutely feral"""
    for _ in range(4):  # TUNG TUNG TUNG TUNG
        sigma.color(random.choice(rizz_colors))
        sigma.circle(30, 90)
        sigma.right(90)
        time.sleep(0.1)

def sahur_moment():
    """The sahur hits different fr fr"""
    sigma.write("SAHUR!", font=("Comic Sans MS", 16, "bold"), align="center")
    time.sleep(0.8)
    sigma.clear()

# Main brainrot loop (only Ohio kids will understand)
for cycle in range(10):
    tung_tung_animation()
    if cycle % 3 == 0:  # Sahur every 3rd tung cycle (because why not)
        sahur_moment()
    
    # Random sigma moves
    sigma.penup()
    sigma.goto(random.randint(-150, 150), random.randint(-100, 100))
    sigma.pendown()
    sigma.setheading(random.randint(0, 360))

sigma.hideturtle()
sigma.write("No cap, this was bussin 🔥", font=("Arial", 14, "normal"), align="center")

print("This turtle really said 'I'm him' and delivered 💀")
