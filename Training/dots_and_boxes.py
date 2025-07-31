import random

class DotsAndBoxes:
    def __init__(self, size=5):
        self.size = size
        self.lines = [
            [0 for _ in range(size if y % 2 == 0 else size + 1)]
            for y in range(size * 2 - 1)
        ]
        print("Lines:", self.lines)
        self.boxes = [["" for _ in range(size)] for _ in range(size)]
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
            if row < self.size:
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
            if x < self.size:
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
                row = y // 2
                for x in range(self.size):
                    line += "•"
                    if self.lines[y][x] != 0:
                        line += "──"
                    else:
                        line += "  "
                line += "•"
            else:  # vertical row
                row = (y - 1) // 2
                for x in range(self.size + 1):
                    if self.lines[y][x] != 0:
                        line += "│  "
                    else:
                        line += "   "
                line = " " + line
            print(line)
        print()



game = DotsAndBoxes(size=5)
game.make_move((0, 4))  # Example move
game.make_move((0, 3))  # Example move
game.make_move((0, 2))  # Example move
game.make_move((0, 1))  # Example move
game.make_move((0, 0))  # Example move
game.make_move((1, 5))  # Example move
game.make_move((1, 4))  # Example move
game.make_move((1, 3))  # Example move
game.make_move((1, 2))  # Example move
game.make_move((1, 1))  # Example move
game.make_move((1, 0))  # Example move

game.print_board()

#while not game.is_game_over():
#    move = random.choice(game.get_possible_moves())
#    game.make_move(move)
#    game.print_board()

print("Skóre:", game.scores)
