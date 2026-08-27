using System;
using System.Collections.Generic;

class Program
{
    static char[,] board = new char[3, 3];
    static char player = 'X';
    static char computer = 'O';

    static void Main()
    {
        InicializarTablero();
        Console.WriteLine("Tres en línea (Tic-Tac-Toe) - .NET consola");
        Console.WriteLine("Elige modo:");
        Console.WriteLine("1) 2 jugadores");
        Console.WriteLine("2) Jugar contra la CPU (IA)");
        Console.Write("Opción: ");
        var mode = Console.ReadLine();

        bool vsCPU = mode == "2";

        ImprimirTablero();

        while (true)
        {
            if (!vsCPU || player == 'X') // si es 2 jugadores, ambos humanos; si vsCPU: jugador humano es X
            {
                TurnoHumano(player);
            }
            else
            {
                TurnoCPU();
            }

            ImprimirTablero();

            var winner = ObtenerGanador();
            if (winner != ' ')
            {
                Console.WriteLine(winner == 'D' ? "Empate!" : $"Gana {winner}!");
                break;
            }

            CambiarJugador();

            // Si modo vs CPU y ahora es turno de la CPU, la CPU juega
            if (vsCPU && player == computer)
            {
                // loop continúa y CPU jugará en la siguiente iteración
            }
        }

        Console.WriteLine("Fin del juego. Pulsa una tecla para salir.");
        Console.ReadKey();
    }

    static void InicializarTablero()
    {
        for (int r = 0; r < 3; r++)
            for (int c = 0; c < 3; c++)
                board[r, c] = ' ';
    }

    static void ImprimirTablero()
    {
        Console.Clear();
        Console.WriteLine("  1 2 3");
        for (int r = 0; r < 3; r++)
        {
            Console.Write($"{r + 1} ");
            for (int c = 0; c < 3; c++)
            {
                Console.Write(board[r, c]);
                if (c < 2) Console.Write("|");
            }
            Console.WriteLine();
            if (r < 2) Console.WriteLine("  -+-+-");
        }
        Console.WriteLine();
    }

    static void TurnoHumano(char who)
    {
        while (true)
        {
            Console.WriteLine($"Turno de {who}. Introduce fila y columna (ej: 2 3):");
            var input = Console.ReadLine();
            if (string.IsNullOrWhiteSpace(input)) continue;
            var parts = input.Trim().Split(new[] { ' ', ',' }, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length != 2) { Console.WriteLine("Formato inválido."); continue; }
            if (!int.TryParse(parts[0], out int r) || !int.TryParse(parts[1], out int c))
            {
                Console.WriteLine("Introduce números válidos.");
                continue;
            }
            r--; c--;
            if (r < 0 || r > 2 || c < 0 || c > 2) { Console.WriteLine("Posición fuera del tablero."); continue; }
            if (board[r, c] != ' ') { Console.WriteLine("Casilla ocupada."); continue; }
            board[r, c] = who;
            break;
        }
    }

    static void TurnoCPU()
    {
        Console.WriteLine("Turno de la CPU...");
        var best = MejorMovimiento();
        board[best.Item1, best.Item2] = computer;
    }

    static void CambiarJugador()
    {
        player = player == 'X' ? 'O' : 'X';
    }

    static char ObtenerGanador()
    {
        // filas y columnas
        for (int i = 0; i < 3; i++)
        {
            if (board[i,0] != ' ' && board[i,0] == board[i,1] && board[i,1] == board[i,2])
                return board[i,0];
            if (board[0,i] != ' ' && board[0,i] == board[1,i] && board[1,i] == board[2,i])
                return board[0,i];
        }
        // diagonales
        if (board[0,0] != ' ' && board[0,0] == board[1,1] && board[1,1] == board[2,2]) return board[0,0];
        if (board[0,2] != ' ' && board[0,2] == board[1,1] && board[1,1] == board[2,0]) return board[0,2];

        // empate?
        bool anyEmpty = false;
        for (int r = 0; r < 3; r++)
            for (int c = 0; c < 3; c++)
                if (board[r, c] == ' ') anyEmpty = true;

        if (!anyEmpty) return 'D'; // D para empate ("Draw")
        return ' '; // nadie aún
    }

    // IA: minimax
    static Tuple<int,int> MejorMovimiento()
    {
        int bestScore = int.MinValue;
        Tuple<int,int> bestMove = Tuple.Create(-1, -1);

        for (int r = 0; r < 3; r++)
        {
            for (int c = 0; c < 3; c++)
            {
                if (board[r,c] == ' ')
                {
                    board[r,c] = computer;
                    int score = Minimax(0, false);
                    board[r,c] = ' ';
                    if (score > bestScore)
                    {
                        bestScore = score;
                        bestMove = Tuple.Create(r,c);
                    }
                }
            }
        }

        return bestMove;
    }

    static int Minimax(int depth, bool isMaximizing)
    {
        var result = ObtenerGanador();
        if (result == computer) return 10 - depth;
        if (result == player) return depth - 10;
        if (result == 'D') return 0;

        if (isMaximizing)
        {
            int bestScore = int.MinValue;
            for (int r = 0; r < 3; r++)
            {
                for (int c = 0; c < 3; c++)
                {
                    if (board[r,c] == ' ')
                    {
                        board[r,c] = computer;
                        int score = Minimax(depth + 1, false);
                        board[r,c] = ' ';
                        bestScore = Math.Max(bestScore, score);
                    }
                }
            }
            return bestScore;
        }
        else
        {
            int bestScore = int.MaxValue;
            for (int r = 0; r < 3; r++)
            {
                for (int c = 0; c < 3; c++)
                {
                    if (board[r,c] == ' ')
                    {
                        board[r,c] = player;
                        int score = Minimax(depth + 1, true);
                        board[r,c] = ' ';
                        bestScore = Math.Min(bestScore, score);
                    }
                }
            }
            return bestScore;
        }
    }
}
