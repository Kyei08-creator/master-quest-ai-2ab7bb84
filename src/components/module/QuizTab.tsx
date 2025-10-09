import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, GraduationCap, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Question {
  question: string;
  type: "mcq" | "true_false" | "short_answer" | "case_study" | "essay";
  options?: string[];
  correctAnswer?: number | string;
  marks: number;
  sectionTitle?: string;
}

interface QuizMetrics {
  practicalityTheoretical: string;
  predictability: string;
  difficulty: string;
  alignment: string;
  learningTime: string;
  proficiency: string;
}

interface QuizData {
  questions: Question[];
  metrics?: QuizMetrics;
}

interface QuizTabProps {
  moduleId: string;
  moduleTopic: string;
  quizType: "quiz" | "final_test";
  onComplete: () => void;
}

const QuizTab = ({ moduleId, moduleTopic, quizType, onComplete }: QuizTabProps) => {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [answers, setAnswers] = useState<Record<number, number | string>>({});
  const [generating, setGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [totalMarks, setTotalMarks] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Persist quiz state locally so it survives navigation away from the module
  const storageKey = `quizState:${moduleId}:${quizType}`;

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        if (saved.quizData) setQuizData(saved.quizData);
        if (saved.answers) setAnswers(saved.answers);
        setShowResults(!!saved.showResults);
        setScore(saved.score || 0);
        setTotalMarks(saved.totalMarks || 0);
        setCurrentQuestionIndex(saved.currentQuestionIndex || 0);
      } catch (e) {
        console.error("Failed to load saved quiz state", e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!quizData) return;
    try {
      const payload = { quizData, answers, showResults, score, totalMarks, currentQuestionIndex };
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (e) {
      // ignore write errors
    }
  }, [quizData, answers, showResults, score, totalMarks, currentQuestionIndex, storageKey]);

  const generateQuiz = async () => {
    setGenerating(true);
    setShowResults(false);
    setAnswers({});
    setCurrentQuestionIndex(0);

    try {
      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: { moduleId, topic: moduleTopic, quizType },
      });

      if (error) throw error;

      setQuizData(data);
      toast.success(`${quizType === "quiz" ? "Quiz" : "Final Test"} generated!`);
    } catch (error: any) {
      console.error("Quiz generation error:", error);
      toast.error(error.message || "Failed to generate quiz");
    } finally {
      setGenerating(false);
    }
  };

  const submitQuiz = async () => {
    if (!quizData) return;
    
    let earnedMarks = 0;
    let totalMarks = 0;
    
    quizData.questions.forEach((q, index) => {
      totalMarks += q.marks;
      const userAnswer = answers[index];
      
      if (q.type === "mcq" || q.type === "true_false") {
        if (userAnswer === q.correctAnswer) {
          earnedMarks += q.marks;
        }
      } else if (q.type === "short_answer" || q.type === "case_study" || q.type === "essay") {
        // For written answers, award full marks if answered (manual grading assumed)
        if (userAnswer && String(userAnswer).trim().length > 0) {
          earnedMarks += q.marks;
        }
      }
    });

    const percentage = Math.round((earnedMarks / totalMarks) * 100);
    setScore(percentage);
    setTotalMarks(earnedMarks);
    setShowResults(true);

    try {
      await supabase.from("quiz_attempts").insert([
        {
          module_id: moduleId,
          score: earnedMarks,
          total_questions: totalMarks,
          attempt_type: quizType,
        },
      ]);

      if (quizType === "final_test") {
        const status = percentage >= 80 ? "completed" : "needs_revisit";
        await supabase
          .from("modules")
          .update({ status, final_score: percentage })
          .eq("id", moduleId);

        if (percentage >= 80) {
          toast.success("🎉 Congratulations! Module completed!");
        } else {
          toast.error("Keep practicing! You need 80% to pass.");
        }

        onComplete();
      }
    } catch (error: any) {
      console.error("Failed to save attempt:", error);
    }
  };

  if (!quizData) {
    return (
      <Card className="shadow-card-custom">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {quizType === "quiz" ? (
              <>
                <Sparkles className="w-5 h-5 text-primary" />
                Practice Quiz
              </>
            ) : (
              <>
                <GraduationCap className="w-5 h-5 text-accent" />
                Final Test
              </>
            )}
          </CardTitle>
          <CardDescription>
            {quizType === "quiz" 
              ? "Test your understanding with a practice quiz (25 MCQ questions)"
              : "Take the final test to complete this module - 50 marks total (80% required to pass)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={generateQuiz} 
            disabled={generating} 
            className={quizType === "final_test" ? "w-full bg-red-600 hover:bg-red-700" : "w-full"}
          >
            {generating ? "Generating..." : quizType === "quiz" ? "Generate Practice Quiz" : "Take Final Test"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (showResults) {
    return (
      <Card className="shadow-card-custom">
        <CardHeader>
          <CardTitle>
            {quizType === "quiz" ? "Quiz Results" : "Final Test Results"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="mb-6">
            <div className="text-6xl font-bold mb-2">{score}%</div>
            <Badge variant={score >= 80 ? "default" : "destructive"} className="mb-4">
              {score >= 80 ? "Passed!" : "Keep Practicing"}
            </Badge>
            <p className="text-muted-foreground">
              {quizType === "final_test" 
                ? `You scored ${totalMarks} out of ${quizData!.questions.reduce((sum, q) => sum + q.marks, 0)} marks`
                : `You got ${Object.values(answers).filter((a, i) => a === quizData!.questions[i].correctAnswer).length} out of ${quizData!.questions.length} correct`
              }
            </p>
          </div>
          <Button onClick={() => { 
            setQuizData(null); 
            setShowResults(false); 
            try { localStorage.removeItem(storageKey); } catch {}
          }}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const totalQuestions = quizData.questions.length;
  const questionsPerPage = quizType === "final_test" ? 3 : 5;
  const startIndex = currentQuestionIndex;
  const endIndex = Math.min(startIndex + questionsPerPage, totalQuestions);
  const currentQuestions = quizData.questions.slice(startIndex, endIndex);

  return (
    <Card className="shadow-card-custom">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>
            Module: {moduleTopic} - {quizType === "quiz" ? "Quiz" : "Final Test"}
          </CardTitle>
          <Badge>{Object.keys(answers).length} / {totalQuestions} answered</Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Test your understanding with a practice {quizType === "quiz" ? "quiz" : "test"} based on the module resources.
        </p>

        {quizData.metrics && (
          <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-3">
              {quizType === "quiz" ? "Quiz" : "Final Test"} Details (AI Metrics)
            </h4>
            <div className="space-y-1 text-sm">
              <p>• **Practicality/Theoretical:** {quizData.metrics.practicalityTheoretical}</p>
              <p>• **Predictability:** {quizData.metrics.predictability}</p>
              <p>• **Difficulty:** {quizData.metrics.difficulty}</p>
              <p>• **Alignment:** {quizData.metrics.alignment}</p>
              <p>• **Learning Time:** {quizData.metrics.learningTime}</p>
              <p>• **Proficiency Required:** {quizData.metrics.proficiency}</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: Math.ceil(totalQuestions / questionsPerPage) }, (_, i) => (
            <Button
              key={i}
              variant={Math.floor(currentQuestionIndex / questionsPerPage) === i ? "default" : "outline"}
              onClick={() => setCurrentQuestionIndex(i * questionsPerPage)}
              size="sm"
            >
              Question {i * questionsPerPage + 1}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <h3 className="text-lg font-semibold">Your {quizType === "quiz" ? "Quiz" : "Test"} Questions</h3>
        
        {currentQuestions.map((q, localIndex) => {
          const qIndex = startIndex + localIndex;
          return (
            <div key={qIndex} className="p-6 bg-muted/50 rounded-lg border-l-4 border-primary">
              {q.sectionTitle && (
                <div className="mb-4">
                  <Badge variant="secondary" className="text-sm font-semibold">
                    {q.sectionTitle}
                  </Badge>
                </div>
              )}
              
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-medium flex-1">
                  {qIndex + 1}. {q.question}
                </h4>
                <Badge variant="outline" className="ml-4">
                  {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
                </Badge>
              </div>

              {(q.type === "mcq" || q.type === "true_false") && q.options && (
                <RadioGroup
                  value={answers[qIndex]?.toString()}
                  onValueChange={(value) => setAnswers({ ...answers, [qIndex]: parseInt(value) })}
                >
                  {q.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center space-x-2 py-2">
                      <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}-o${oIndex}`} />
                      <Label htmlFor={`q${qIndex}-o${oIndex}`} className="cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {(q.type === "short_answer" || q.type === "case_study" || q.type === "essay") && (
                <textarea
                  className="w-full p-3 mt-2 border rounded-md bg-background min-h-[120px] focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={
                    q.type === "essay" 
                      ? "Write your detailed answer here (minimum 150 words recommended)..." 
                      : "Type your answer here..."
                  }
                  value={answers[qIndex] as string || ""}
                  onChange={(e) => setAnswers({ ...answers, [qIndex]: e.target.value })}
                />
              )}
            </div>
          );
        })}

        <div className="flex justify-between items-center pt-4">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - questionsPerPage))}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          
          {endIndex < totalQuestions ? (
            <Button onClick={() => setCurrentQuestionIndex(endIndex)}>
              Next
            </Button>
          ) : (
            <Button
              onClick={submitQuiz}
              disabled={Object.keys(answers).length !== totalQuestions}
              className={quizType === "final_test" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              Submit {quizType === "quiz" ? "Quiz" : "Final Test"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizTab;
