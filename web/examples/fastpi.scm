;; Helper to abstract the integer square root.
;; Standard R6RS/R7RS Scheme uses `exact-integer-sqrt` which returns two values.
(define (isqrt n)
  (let-values (((root rem) (exact-integer-sqrt n)))
    root))

;; Fast Pi using the Gauss-Legendre Algorithm
(define (calc-pi-fast digits)
  (let* ((guard 10)
         ;; S is our massive scaling factor: 10^(digits + guard)
         (S (expt 10 (+ digits guard)))
         
         ;; Step 1: Initialization
         (a S)
         (b (isqrt (quotient (* S S) 2)))
         (t (quotient S 4))
         (p 1))
    
    ;; Step 2: Iteration loop
    (let loop ((a a) (b b) (t t) (p p))
      ;; If the difference between a and b is tiny, we've converged.
      (if (<= (- a b) 5)
          (let* ((a+b (+ a b))
                 ;; pi * S = (a + b)^2 / (4 * t)
                 (pi-scaled (quotient (* a+b a+b) (* 4 t)))
                 (pi-str (number->string pi-scaled)))
            ;; Strip leading '3' and return requested fractional digits
            (substring pi-str 1 (+ 1 digits)))
          
          ;; Otherwise, compute the next generation of variables
          (let* ((a-next (quotient (+ a b) 2))
                 (b-next (isqrt (* a b)))
                 (diff (- a a-next))
                 (t-next (- t (quotient (* p (* diff diff)) S)))
                 (p-next (* 2 p)))
            (loop a-next b-next t-next p-next))))))

;; The formatting function (remains exactly the same)
(define (print-pi-fast digits)
  (if (<= digits 0)
      (display "Please request 1 or more digits.\n")
      (let ((pi-frac (calc-pi-fast digits)))
        (display "3.\n")
        (let loop ((i 0))
          (if (< i digits)
              (let ((chunk-size (min 5 (- digits i))))
                (display (substring pi-frac i (+ i chunk-size)))
                (cond
                  ((= (modulo (+ i chunk-size) 50) 0) 
                   (newline))
                  ((< (+ i chunk-size) digits) 
                   (display " ")))
                (loop (+ i chunk-size)))))
        (newline))))

;; --- Example Usage ---
;; This will comfortably handle large requests. 
;; (Warning: Printing 1,000,000 digits to your console will likely be your bottleneck!)
(print-pi-fast 100000)
