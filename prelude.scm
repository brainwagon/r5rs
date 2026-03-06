;;; R5RS Standard Library Prelude

;;; Standard procedures
(define (not x) (if x #f #t))

(define (call-with-current-continuation proc) (call-with-current-continuation proc))
(define call/cc call-with-current-continuation)

(define (list? x)
  (let loop ((x x) (slow x))
    (if (null? x) #t
        (if (not (pair? x)) #f
            (let ((x (cdr x)))
              (if (null? x) #t
                  (if (not (pair? x)) #f
                      (if (eq? x slow) #f
                          (loop (cdr x) (cdr slow))))))))))

;;; Pairs and lists
(define (caar x) (car (car x)))
(define (cadr x) (car (cdr x)))
(define (cdar x) (cdr (car x)))
(define (cddr x) (cdr (cdr x)))
(define (caaar x) (car (caar x)))
(define (caadr x) (car (cadr x)))
(define (cadar x) (car (cdar x)))
(define (caddr x) (car (cddr x)))
(define (cdaar x) (cdr (caar x)))
(define (cdadr x) (cdr (cadr x)))
(define (cddar x) (cdr (cdar x)))
(define (cdddr x) (cdr (cddr x)))
(define (caaaar x) (car (caaar x)))
(define (caaadr x) (car (caadr x)))
(define (caadar x) (car (cadar x)))
(define (caaddr x) (car (caddr x)))
(define (cadaar x) (car (cdaar x)))
(define (cadadr x) (car (cdadr x)))
(define (caddar x) (car (cddar x)))
(define (cadddr x) (car (cdddr x)))
(define (cdaaar x) (cdr (caaar x)))
(define (cdaadr x) (cdr (caadr x)))
(define (cdadar x) (cdr (cadar x)))
(define (cdaddr x) (cdr (caddr x)))
(define (cddaar x) (cdr (cdaar x)))
(define (cddadr x) (cdr (cdadr x)))
(define (cdddar x) (cdr (cddar x)))
(define (cddddr x) (cdr (cdddr x)))

(define (length lst)
  (let loop ((l lst) (n 0))
    (if (null? l) n
        (loop (cdr l) (+ n 1)))))

(define (append . lists)
  (cond ((null? lists) '())
        ((null? (cdr lists)) (car lists))
        (else
         (letrec ((append-2 (lambda (l1 l2)
                              (if (null? l1) l2
                                  (cons (car l1) (append-2 (cdr l1) l2))))))
           (append-2 (car lists) (apply append (cdr lists)))))))

(define (reverse lst)
  (let loop ((l lst) (res '()))
    (if (null? l) res
        (loop (cdr l) (cons (car l) res)))))

(define (list-ref lst k)
  (if (zero? k) (car lst)
      (list-ref (cdr lst) (- k 1))))

(define (list-tail lst k)
  (if (zero? k) lst
      (list-tail (cdr lst) (- k 1))))

;;; Association lists and members
(define (memq obj lst)
  (cond ((null? lst) #f)
        ((eq? obj (car lst)) lst)
        (else (memq obj (cdr lst)))))

(define (member obj lst)
  (cond ((null? lst) #f)
        ((equal? obj (car lst)) lst)
        (else (member obj (cdr lst)))))

(define (assq obj alist)
  (cond ((null? alist) #f)
        ((eq? obj (car (car alist))) (car alist))
        (else (assq obj (cdr alist)))))

(define (assoc obj alist)
  (cond ((null? alist) #f)
        ((equal? obj (car (car alist))) (car alist))
        (else (assoc obj (cdr alist)))))

(define (assv obj alist)
  (cond ((null? alist) #f)
        ((eqv? obj (car (car alist))) (car alist))
        (else (assv obj (cdr alist)))))

;;; Numeric predicates and functions
(define (positive? x) (> x 0))
(define (negative? x) (< x 0))
(define (odd? x) (not (even? x)))
(define (even? x) (= (remainder x 2) 0))

(define (abs x) (if (< x 0) (- x) x))

(define (max x . rest)
  (let loop ((m x) (r rest))
    (if (null? r) m
        (loop (if (> (car r) m) (car r) m) (cdr r)))))

(define (min x . rest)
  (let loop ((m x) (r rest))
    (if (null? r) m
        (loop (if (< (car r) m) (car r) m) (cdr r)))))

;;; Equalities
(define (eq? a b) (eqv? a b))

;;; equal? is provided as a C primitive (prim_equal_p) which handles
;;; pairs, strings, vectors, and delegates to eqv? for other types.

;;; Character procedures
(define (char=? a b) (eqv? a b))
(define (char<? a b) (< (char->integer a) (char->integer b)))
(define (char>? a b) (> (char->integer a) (char->integer b)))
(define (char<=? a b) (<= (char->integer a) (char->integer b)))
(define (char>=? a b) (>= (char->integer a) (char->integer b)))

(define (char-ci=? a b) (char=? (char-downcase a) (char-downcase b)))
(define (char-ci<? a b) (char<? (char-downcase a) (char-downcase b)))
(define (char-ci>? a b) (char>? (char-downcase a) (char-downcase b)))
(define (char-ci<=? a b) (char<=? (char-downcase a) (char-downcase b)))
(define (char-ci>=? a b) (char>=? (char-downcase a) (char-downcase b)))

;;; String procedures
(define (string=? a b)
  (let ((len (string-length a)))
    (and (= len (string-length b))
         (let loop ((i 0))
           (if (= i len) #t
               (and (char=? (string-ref a i) (string-ref b i))
                    (loop (+ i 1))))))))

(define (string-ci=? a b)
  (let ((len (string-length a)))
    (and (= len (string-length b))
         (let loop ((i 0))
           (if (= i len) #t
               (and (char-ci=? (string-ref a i) (string-ref b i))
                    (loop (+ i 1))))))))

(define (string<? a b)
  (let ((len1 (string-length a))
        (len2 (string-length b)))
    (let loop ((i 0))
      (cond ((= i len1) (< i len2))
            ((= i len2) #f)
            ((char=? (string-ref a i) (string-ref b i)) (loop (+ i 1)))
            (else (char<? (string-ref a i) (string-ref b i)))))))

(define (string-ci<? a b)
  (let ((len1 (string-length a))
        (len2 (string-length b)))
    (let loop ((i 0))
      (cond ((= i len1) (< i len2))
            ((= i len2) #f)
            ((char-ci=? (string-ref a i) (string-ref b i)) (loop (+ i 1)))
            (else (char-ci<? (string-ref a i) (string-ref b i)))))))

(define (string>? a b) (string<? b a))
(define (string<=? a b) (not (string>? a b)))
(define (string>=? a b) (not (string<? a b)))

(define (string-ci>? a b) (string-ci<? b a))
(define (string-ci<=? a b) (not (string-ci>? a b)))
(define (string-ci>=? a b) (not (string-ci<? a b)))

(define (string-append . strings)
  (let* ((total-len (apply + (map string-length strings)))
         (new-str (make-string total-len)))
    (let loop ((ss strings) (pos 0))
      (if (null? ss) new-str
          (let* ((s (car ss))
                 (len (string-length s)))
            (let copy ((i 0))
              (if (= i len)
                  (loop (cdr ss) (+ pos len))
                  (begin (string-set! new-str (+ pos i) (string-ref s i))
                         (copy (+ i 1))))))))))

(define (substring s start end)
  (let* ((len (- end start))
         (new-str (make-string len)))
    (let loop ((i 0))
      (if (= i len) new-str
          (begin (string-set! new-str i (string-ref s (+ start i)))
                 (loop (+ i 1)))))))

(define (string-copy s) (substring s 0 (string-length s)))

(define (string-fill! s c)
  (let ((len (string-length s)))
    (let loop ((i 0))
      (if (= i len) s
          (begin (string-set! s i c)
                 (loop (+ i 1)))))))

;;; Vector procedures
(define (vector-fill! v fill)
  (let ((len (vector-length v)))
    (let loop ((i 0))
      (if (= i len) v
          (begin (vector-set! v i fill)
                 (loop (+ i 1)))))))

(define (vector->list v)
  (let ((len (vector-length v)))
    (let loop ((i (- len 1)) (res '()))
      (if (< i 0) res
          (loop (- i 1) (cons (vector-ref v i) res))))))

(define (list->vector lst)
  (let* ((len (length lst))
         (v (make-vector len)))
    (let loop ((l lst) (i 0))
      (if (null? l) v
          (begin (vector-set! v i (car l))
                 (loop (cdr l) (+ i 1)))))))

(define (string->list s)
  (let ((len (string-length s)))
    (let loop ((i (- len 1)) (res '()))
      (if (< i 0) res
          (loop (- i 1) (cons (string-ref s i) res))))))

(define (list->string lst)
  (let* ((len (length lst))
         (s (make-string len)))
    (let loop ((l lst) (i 0))
      (if (null? l) s
          (begin (string-set! i (car l))
                 (loop (cdr l) (+ i 1)))))))

;;; Higher-order functions
(define (map proc list1 . lists)
  (if (null? lists)
      (let loop ((l list1))
        (if (null? l) '()
            (cons (proc (car l)) (loop (cdr l)))))
      (let loop ((ls (cons list1 lists)))
        (if (null? (car ls)) '()
            (cons (apply proc (let map-car ((l ls))
                                (if (null? l) '()
                                    (cons (car (car l)) (map-car (cdr l))))))
                  (loop (let map-cdr ((l ls))
                          (if (null? l) '()
                              (cons (cdr (car l)) (map-cdr (cdr l)))))))))))

(define (for-each proc list1 . lists)
  (if (null? lists)
      (let loop ((l list1))
        (if (null? l) #t
            (begin (proc (car l)) (loop (cdr l)))))
      (let loop ((ls (cons list1 lists)))
        (if (null? (car ls)) #t
            (begin (apply proc (let map-car ((l ls))
                                 (if (null? l) '()
                                     (cons (car (car l)) (map-car (cdr l))))))
                   (loop (let map-cdr ((l ls))
                           (if (null? l) '()
                               (cons (cdr (car l)) (map-cdr (cdr l)))))))))))
