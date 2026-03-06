;; Helper function to calculate arccot(x) multiplied by a scale factor
;; using the Taylor series: arccot(x) = 1/x - 1/(3x^3) + 1/(5x^5) - ...
(define (arccot x scale)
  (let loop ((term (quotient scale x))
             (sum (quotient scale x))
             (n 3)
             (sign -1)
             (x2 (* x x)))
    (let ((next-term (quotient term x2)))
      (if (zero? next-term)
          sum
          (loop next-term
                (+ sum (* sign (quotient next-term n)))
                (+ n 2)
                (- sign)
                x2)))))

;; Function to compute Pi to a specific number of decimal places
(define (calc-pi-digits digits)
  ;; Add 10 guard digits to prevent rounding errors at the tail end
  (let* ((guard 10)
         (scale (expt 10 (+ digits guard)))
         ;; Machin's Formula: Pi = 16*arccot(5) - 4*arccot(239)
         (pi-scaled (- (* 16 (arccot 5 scale))
                       (* 4 (arccot 239 scale))))
         ;; Convert the massive integer to a string
         (pi-str (number->string pi-scaled)))
    ;; The integer part is 3, so we extract just the fractional digits we need
    (substring pi-str 1 (+ 1 digits))))

;; Main function to calculate and format the output
(define (print-pi digits)
  (if (<= digits 0)
      (display "Please request 1 or more digits.\n")
      (let ((pi-frac (calc-pi-digits digits)))
        (display "3.\n")
        (let loop ((i 0))
          (if (< i digits)
              (let ((chunk-size (min 5 (- digits i))))
                ;; Print the next chunk of digits
                (display (substring pi-frac i (+ i chunk-size)))
                
                ;; Handle formatting: spaces between chunks, newlines every 50 digits
                (cond
                  ((= (modulo (+ i chunk-size) 50) 0) 
                   (newline))
                  ((< (+ i chunk-size) digits) 
                   (display " ")))
                
                ;; Continue the loop
                (loop (+ i chunk-size)))))
        (newline))))

;; --- Example Usage ---
;; Generates 150 digits of Pi
(print-pi 1000000)

