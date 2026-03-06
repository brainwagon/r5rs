;;; Factorial Examples

;;; Recursive implementation
(define factorial-rec
  (lambda (n)
    (if (zero? n)
        1
        (* n (factorial-rec (- n 1))))))

;;; Iterative implementation (Tail-Recursive)
(define factorial-iter
  (lambda (n)
    (let loop ((i n) (res 1))
      (if (zero? i)
          res
          (loop (- i 1) (* i res))))))

;;; Test Suite
(define test
  (lambda (name expected actual)
    (display "Testing ") (display name) (display ": ")
    (if (equal? expected actual)
        (begin (display "PASS") (newline))
        (begin (display "FAIL (Expected ") (display expected) 
               (display " but got ") (display actual) (display ")") (newline)))))

(newline)
(display "Running Factorial Tests...") (newline)

(test "Recursive 5!" 120 (factorial-rec 5))
(test "Iterative 5!" 120 (factorial-iter 5))
(test "Recursive 0!" 1 (factorial-rec 0))
(test "Iterative 0!" 1 (factorial-iter 0))

;;; Test with Bignums
(display "Testing with large numbers (Bignum promotion)...") (newline)
(test "Iterative 20!" 2432902008176640000 (factorial-iter 20))
(test "Iterative 30!" 265252859812191058636308480000000 (factorial-iter 30))

(newline)
(display "Done.") (newline)
