using Hime.Demo.Tasks;

namespace Hime.Demo
{
    public class Program
    {
        static void Main()
        {
            IExecutable executable = new ParseGrammar();
            executable.Execute();
        }
    }
}
