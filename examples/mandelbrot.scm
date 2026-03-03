;;; Mandelbrot Set ASCII Art Example

(define mandelbrot
  (lambda (x y max-iter)
    (let loop ((zr 0.0) (zi 0.0) (i 0))
      (if (>= i max-iter)
          #t
          (let ((zr2 (* zr zr))
                (zi2 (* zi zi)))
            (if (> (+ zr2 zi2) 4.0)
                i
                (loop (+ (- zr2 zi2) x)
                      (+ (* 2.0 (* zr zi)) y)
                      (+ i 1))))))))

(define draw-mandelbrot
  (lambda (x-min x-max y-min y-max x-step y-max-step)
    (let loop-y ((y y-min))
      (if (<= y y-max)
          (begin
            (let loop-x ((x x-min))
              (if (<= x x-max)
                  (begin
                    (let ((res (mandelbrot x y 30)))
                      (if (boolean? res)
                          (display "#")
                          (if (> res 15)
                              (display "+")
                              (if (> res 5)
                                  (display ".")
                                  (display " ")))))
                    (loop-x (+ x x-step)))
                  (newline)))
            (loop-y (+ y y-max-step)))))))

(display "Generating Mandelbrot Set...") (newline)
(newline)

;; Parameters: x-min x-max y-min y-max x-step y-step
(draw-mandelbrot -2.0 0.5 -1.0 1.0 0.05 0.1)

(newline)
(display "Done.") (newline)
