;;; N-Queens Problem
;;; Counts the number of ways to place N queens on an NxN board.

(define n-queens
  (lambda (n)
    (letrec ((safe?
              (lambda (row col positions)
                (let loop ((pos positions))
                  (if (null? pos)
                      #t
                      (let* ((p (car pos))
                             (p-row (car p))
                             (p-col (cdr p)))
                        (if (or (= p-col col)
                                (= (abs (- p-row row)) (abs (- p-col col))))
                            #f
                            (loop (cdr pos))))))))
             (solve
              (lambda (row positions)
                (if (= row n)
                    1
                    (let loop ((col 0) (total 0))
                      (if (= col n)
                          total
                          (if (safe? row col positions)
                              (loop (+ col 1) 
                                    (+ total (solve (+ row 1) (cons (cons row col) positions))))
                              (loop (+ col 1) total))))))))
      (solve 0 '()))))

;;; Test Suite
(define test
  (lambda (n expected)
    (display "Testing ") (display n) (display "-Queens: ")
    (let ((actual (n-queens n)))
      (display actual)
      (if (= actual expected)
          (begin (display " [PASS]") (newline))
          (begin (display " [FAIL] Expected ") (display expected) (newline))))))

(newline)
(display "Running N-Queens Benchmarks...") (newline)

(test 1 1)
(test 2 0)
(test 3 0)
(test 4 2)
(test 5 10)
(test 6 4)
(test 7 40)
(test 8 92)

(display "Done.") (newline)
