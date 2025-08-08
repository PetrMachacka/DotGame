import random
import pickle

class QLearningBot:
    def __init__(self, alpha=0.15, gamma=0.95, epsilon=0.3, epsilon_decay=0.995):
        self.q = {}  # Q-table
        self.alpha = alpha
        self.gamma = gamma
        self.epsilon = epsilon
        self.epsilon_decay = epsilon_decay
        self.epsilon_min = 0.05

    def get_state(self, game):
        # Use a more compact state representation focusing on strategic positions
        state = []
        for row in game.lines:
            state.append(tuple(row))
        return tuple(state)

    def choose_move(self, game, training=True):
        state = self.get_state(game)
        moves = game.get_possible_moves()
        
        if training and random.random() < self.epsilon:
            return random.choice(moves)
        
        # Get Q-values for all moves
        qvals = [self.q.get((state, move), 0) for move in moves]
        maxq = max(qvals) if qvals else 0
        
        # Add small random noise to break ties
        best_moves = [m for m, qv in zip(moves, qvals) if abs(qv - maxq) < 0.001]
        return random.choice(best_moves)

    def update(self, prev_state, move, reward, next_state, next_moves, game_over=False):
        prev_q = self.q.get((prev_state, move), 0)
        
        if game_over:
            next_q = 0
        else:
            next_q = max([self.q.get((next_state, m), 0) for m in next_moves]) if next_moves else 0
        
        # Q-learning update
        target = reward + self.gamma * next_q
        self.q[(prev_state, move)] = prev_q + self.alpha * (target - prev_q)

    def decay_epsilon(self):
        if self.epsilon > self.epsilon_min:
            self.epsilon *= self.epsilon_decay

    def get_reward(self, game, player, prev_score, completed_box):
        """Calculate reward based on game state"""
        current_score = game.scores[player]
        score_diff = current_score - prev_score
        
        # Base reward for completing boxes
        reward = score_diff * 10
        
        # Penalty for giving opponent easy boxes
        opponent = 2 if player == 1 else 1
        opponent_easy_boxes = self.count_easy_boxes(game)
        reward -= opponent_easy_boxes * 2
        
        # Small reward for strategic positioning
        if score_diff == 0:  # No box completed
            reward += 0.1
            
        return reward

    def count_easy_boxes(self, game):
        """Count boxes that can be completed in one move"""
        easy_boxes = 0
        size = game.size - 1
        
        for i in range(size):
            for j in range(size):
                sides = 0
                box_y = i * 2 + 1
                
                # Count existing sides
                if game.lines[box_y - 1][j] != 0:  # Top
                    sides += 1
                if game.lines[box_y + 1][j] != 0:  # Bottom
                    sides += 1
                if game.lines[box_y][j] != 0:     # Left
                    sides += 1
                if game.lines[box_y][j + 1] != 0: # Right
                    sides += 1
                
                if sides == 3:
                    easy_boxes += 1
                    
        return easy_boxes

class DotsAndBoxes:
    def __init__(self, size=6):
        size += 1
        self.size = size  # number of dots per side
        self.lines = [
            [0 for _ in range(size - 1 if y % 2 == 0 else size)]
            for y in range(size * 2 - 1)
        ]
        # print("Lines:", self.lines)
        self.boxes = [["" for _ in range(size - 1)] for _ in range(size - 1)]
        self.current_player = 1
        self.scores = {1: 0, 2: 0}

    def get_possible_moves(self):
        return [(y, x)
                for y in range(len(self.lines))
                for x in range(len(self.lines[y]))
                if self.lines[y][x] == 0]

    def make_move(self, move):
        y, x = move
        self.lines[y][x] = self.current_player
        completed_box = self.update_boxes(y, x)
        if not completed_box:
            self.current_player = 2 if self.current_player == 1 else 1
        return completed_box

    def update_boxes(self, y, x):
        completed = False
        if y % 2 == 0:  # horizontal line
            row = y // 2
            if row > 0:
                self.boxes[row-1][x] += "B"
                if len(self.boxes[row-1][x]) == 4:
                    self.scores[self.current_player] += 1
                    completed = True
            if row < self.size - 1:
                self.boxes[row][x] += "T"
                if len(self.boxes[row][x]) == 4:
                    self.scores[self.current_player] += 1
                    completed = True
        else:  # vertical line
            row = (y-1) // 2
            if x > 0:
                self.boxes[row][x-1] += "R"
                if len(self.boxes[row][x-1]) == 4:
                    self.scores[self.current_player] += 1
                    completed = True
            if x < self.size - 1:
                self.boxes[row][x] += "L"
                if len(self.boxes[row][x]) == 4:
                    self.scores[self.current_player] += 1
                    completed = True
        return completed

    def is_game_over(self):
        return all(all(cell != 0 for cell in row) for row in self.lines)

    def print_board(self):
        for y in range(self.size * 2 - 1):
            line = ""
            if y % 2 == 0:  # horizontal row with dots
                for x in range(self.size - 1):
                    line += "•"
                    if self.lines[y][x] != 0:
                        line += "──"
                    else:
                        line += "  "
                line += "•"
            else:  # vertical row
                for x in range(self.size):
                    if self.lines[y][x] != 0:
                        line += "│  "
                    else:
                        line += "   "
                line = " " + line
            print(line)
        print()

# Training loop
if __name__ == "__main__":
    print("Starting Q-learning training...")
    bot = QLearningBot()
    
    # Train on multiple board sizes for better generalization
    board_sizes = [3, 4, 5]
    episodes_per_size = 3000
    
    total_episodes = 0
    for size in board_sizes:
        print(f"Training on {size}x{size} boards...")
        incomplete_games = 0
        
        for ep in range(episodes_per_size):
            game = DotsAndBoxes(size=size)
            game_history = []
            moves_made = 0
            max_possible_moves = (size) * 2 * (size - 1) + (size - 1) * 2  # Theoretical maximum
            
            while not game.is_game_over() and moves_made < max_possible_moves * 2:  # Safety limit
                current_player = game.current_player
                state = bot.get_state(game)
                
                possible_moves = game.get_possible_moves()
                if not possible_moves:
                    break  # No moves available
                    
                move = bot.choose_move(game, training=True)
                prev_score = game.scores[current_player]
                
                completed_box = game.make_move(move)
                moves_made += 1
                
                # Calculate better reward
                reward = bot.get_reward(game, current_player, prev_score, completed_box)
                
                next_state = bot.get_state(game)
                next_moves = game.get_possible_moves()
                
                # Store for later batch update
                game_history.append((state, move, reward, next_state, next_moves, game.is_game_over()))
            
            # Check if game completed properly
            if not game.is_game_over():
                incomplete_games += 1
            
            # Update Q-values for all moves in the game
            for state, move, reward, next_state, next_moves, game_over in game_history:
                bot.update(state, move, reward, next_state, next_moves, game_over)
            
            # Decay exploration rate
            bot.decay_epsilon()
            
            total_episodes += 1
            if total_episodes % 1000 == 0:
                print(f"Episode {total_episodes}, epsilon: {bot.epsilon:.3f}, Q-table size: {len(bot.q)}, incomplete: {incomplete_games}")
        
        print(f"Size {size}x{size}: {incomplete_games}/{episodes_per_size} games incomplete ({incomplete_games/episodes_per_size*100:.1f}%)")
    
    print(f"Training completed! Final Q-table size: {len(bot.q)}")
    
    # Export Q-table for JavaScript
    import json
    q_serializable = {}
    for (state, move), value in bot.q.items():
        # Convert state and move to string format for JSON
        state_str = json.dumps(state)
        move_str = json.dumps(move)
        key = json.dumps([state_str, move_str])
        q_serializable[key] = value
    
    with open("c:/Users/macha/moje/Random programy/testPages/WebPart/public/qtable.json", "w") as f:
        json.dump(q_serializable, f)
    
    print(f"Q-table exported with {len(q_serializable)} entries")
    
    # Test the bot's performance
    print("\nTesting bot performance...")
    wins = 0
    games = 100
    
    for _ in range(games):
        game = DotsAndBoxes(size=4)  # Test on 4x4
        players = [None, "random", bot]  # Player 1 is random, Player 2 is bot
        
        while not game.is_game_over():
            if game.current_player == 1:
                # Random player
                move = random.choice(game.get_possible_moves())
            else:
                # Trained bot
                move = bot.choose_move(game, training=False)
            
            game.make_move(move)
        
        if game.scores[2] > game.scores[1]:
            wins += 1
    
    print(f"Bot won {wins}/{games} games against random player ({wins/games*100:.1f}%)")
    
    # Demonstrate one game
    print("\nBot demonstration:")
    game = DotsAndBoxes(size=4)
    game.print_board()
    move_count = 0
    max_moves = (game.size - 1) * 2 * (game.size - 1) + (game.size - 1) * (game.size) * 2  # Calculate actual max moves needed
    print(f"Game will have approximately {max_moves} total moves possible")
    
    while not game.is_game_over() and move_count < max_moves:  # Use proper limit
        if game.current_player == 1:
            move = random.choice(game.get_possible_moves())
            print(f"Random player: {move}")
        else:
            move = bot.choose_move(game, training=False)
            print(f"Bot: {move}")
        
        completed = game.make_move(move)
        if completed:
            print(f"  -> Player {game.current_player} completed a box! Gets another turn.")
        game.print_board()
        move_count += 1
        
        # Safety check
        if len(game.get_possible_moves()) == 0:
            break
    
    print(f"Game ended after {move_count} moves")
    print("Final scores:", game.scores)
    if game.is_game_over():
        print("✅ Game completed properly!")
    else:
        print("⚠️ Game ended prematurely")
