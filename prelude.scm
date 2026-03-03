;;; R5RS Standard Library Prelude

;;; Standard procedures
(define not (lambda (x) (if x #f #t)))

(define call-with-current-continuation (lambda (proc) (call-with-current-continuation proc)))
(define call/cc call-with-current-continuation)

(define list? 
  (lambda (x)
    (let loop ((x x) (slow x))
      (if (null? x) #t
          (if (not (pair? x)) #f
              (let ((x (cdr x)))
                (if (null? x) #t
                    (if (not (pair? x)) #f
                        (if (eq? x slow) #f
                            (loop (cdr x) (cdr slow)))))))))))

;;; Pairs and lists
(define caar (lambda (x) (car (car x))))
(define cadr (lambda (x) (car (cdr x))))
(define cdar (lambda (x) (cdr (car x))))
(define cddr (lambda (x) (cdr (cdr x))))
(define caaar (lambda (x) (car (caar x))))
(define caadr (lambda (x) (car (cadr x))))
(define cadar (lambda (x) (car (cdar x))))
(define caddr (lambda (x) (car (cddr x))))
(define cdaar (lambda (x) (cdr (caar x))))
(define cdadr (lambda (x) (cdr (cadr x))))
(define cddar (lambda (x) (cdr (cdar x))))
(define cdddr (lambda (x) (cdr (cddr x))))
(define caaaar (lambda (x) (car (caaar x))))
(define caaadr (lambda (x) (car (caadr x))))
(define caadar (lambda (x) (car (cadar x))))
(define caaddr (lambda (x) (car (caddr x))))
(define cadaar (lambda (x) (car (cdaar x))))
(define cadadr (lambda (x) (car (cdadr x))))
(define caddar (lambda (x) (car (cddar x))))
(define cadddr (lambda (x) (car (cdddr x))))
(define cdaaar (lambda (x) (cdr (caaar x))))
(define cdaadr (lambda (x) (cdr (caadr x))))
(define cdadar (lambda (x) (cdr (cadar x))))
(define cdaddr (lambda (x) (cdr (caddr x))))
(define cddaar (lambda (x) (cdr (cdaar x))))
(define cddadr (lambda (x) (cdr (cdadr x))))
(define cdddar (lambda (x) (cdr (cddar x))))
(define cddddr (lambda (x) (cdr (cdddr x))))

(define length 
  (lambda (lst)
    (let loop ((l lst) (n 0))
      (if (null? l) n
          (loop (cdr l) (+ n 1))))))

(define append 
  (lambda lists
    (cond ((null? lists) '())
          ((null? (cdr lists)) (car lists))
          (else
           (letrec ((append-2 (lambda (l1 l2)
                                (if (null? l1) l2
                                    (cons (car l1) (append-2 (cdr l1) l2))))))
             (append-2 (car lists) (apply append (cdr lists))))))))

(define reverse 
  (lambda (lst)
    (let loop ((l lst) (res '()))
      (if (null? l) res
          (loop (cdr l) (cons (car l) res))))))

(define list-ref 
  (lambda (lst k)
    (if (zero? k) (car lst)
        (list-ref (cdr lst) (- k 1)))))

(define list-tail 
  (lambda (lst k)
    (if (zero? k) lst
        (list-tail (cdr lst) (- k 1)))))

;;; Association lists and members
(define memq 
  (lambda (obj lst)
    (cond ((null? lst) #f)
          ((eq? obj (car lst)) lst)
          (else (memq obj (cdr lst))))))

(define member 
  (lambda (obj lst)
    (cond ((null? lst) #f)
          ((equal? obj (car lst)) lst)
          (else (member obj (cdr lst))))))

(define assq 
  (lambda (obj alist)
    (cond ((null? alist) #f)
          ((eq? obj (car (car alist))) (car alist))
          (else (assq obj (cdr alist))))))

(define assoc 
  (lambda (obj alist)
    (cond ((null? alist) #f)
          ((equal? obj (car (car alist))) (car alist))
          (else (assoc obj (cdr alist))))))

(define assv 
  (lambda (obj alist)
    (cond ((null? alist) #f)
          ((eqv? obj (car (car alist))) (car alist))
          (else (assv obj (cdr alist))))))

;;; Numeric predicates and functions
(define positive? (lambda (x) (> x 0)))
(define negative? (lambda (x) (< x 0)))
(define odd? (lambda (x) (not (even? x))))
(define even? (lambda (x) (= (remainder x 2) 0)))

(define abs (lambda (x) (if (< x 0) (- x) x)))

(define max 
  (lambda (x . rest)
    (let loop ((m x) (r rest))
      (if (null? r) m
          (loop (if (> (car r) m) (car r) m) (cdr r))))))

(define min 
  (lambda (x . rest)
    (let loop ((m x) (r rest))
      (if (null? r) m
          (loop (if (< (car r) m) (car r) m) (cdr r))))))

;;; Equalities
(define eq? (lambda (a b) (eqv? a b)))

(define equal? 
  (lambda (a b)
    (cond ((eqv? a b) #t)
          ((and (pair? a) (pair? b))
           (and (equal? (car a) (car b)) (equal? (cdr a) (cdr b))))
          ((and (string? a) (string? b))
           (string=? a b))
          ((and (vector? a) (vector? b))
           (let ((len (vector-length a)))
             (and (= len (vector-length b))
                  (let loop ((i 0))
                    (if (= i len) #t
                        (and (equal? (vector-ref a i) (vector-ref b i))
                             (loop (+ i 1))))))))
          (else #f))))

;;; Character procedures
(define char=? (lambda (a b) (eqv? a b)))
(define char<? (lambda (a b) (< (char->integer a) (char->integer b))))
(define char>? (lambda (a b) (> (char->integer a) (char->integer b))))
(define char<=? (lambda (a b) (<= (char->integer a) (char->integer b))))
(define char>=? (lambda (a b) (>= (char->integer a) (char->integer b))))

(define char-ci=? (lambda (a b) (char=? (char-downcase a) (char-downcase b))))
(define char-ci<? (lambda (a b) (char<? (char-downcase a) (char-downcase b))))
(define char-ci>? (lambda (a b) (char>? (char-downcase a) (char-downcase b))))
(define char-ci<=? (lambda (a b) (char<=? (char-downcase a) (char-downcase b))))
(define char-ci>=? (lambda (a b) (char>=? (char-downcase a) (char-downcase b))))

;;; String procedures
(define string=? 
  (lambda (a b)
    (let ((len (string-length a)))
      (and (= len (string-length b))
           (let loop ((i 0))
             (if (= i len) #t
                 (and (char=? (string-ref a i) (string-ref b i))
                      (loop (+ i 1)))))))))

(define string-ci=? 
  (lambda (a b)
    (let ((len (string-length a)))
      (and (= len (string-length b))
           (let loop ((i 0))
             (if (= i len) #t
                 (and (char-ci=? (string-ref a i) (string-ref b i))
                      (loop (+ i 1)))))))))

(define string<? 
  (lambda (a b)
    (let ((len1 (string-length a))
          (len2 (string-length b)))
      (let loop ((i 0))
        (cond ((= i len1) (< i len2))
              ((= i len2) #f)
              ((char=? (string-ref a i) (string-ref b i)) (loop (+ i 1)))
              (else (char<? (string-ref a i) (string-ref b i))))))))

(define string-ci<? 
  (lambda (a b)
    (let ((len1 (string-length a))
          (len2 (string-length b)))
      (let loop ((i 0))
        (cond ((= i len1) (< i len2))
              ((= i len2) #f)
              ((char-ci=? (string-ref a i) (string-ref b i)) (loop (+ i 1)))
              (else (char-ci<? (string-ref a i) (string-ref b i))))))))

(define string>? (lambda (a b) (string<? b a)))
(define string<=? (lambda (a b) (not (string>? a b))))
(define string>=? (lambda (a b) (not (string<? a b))))

(define string-ci>? (lambda (a b) (string-ci<? b a)))
(define string-ci<=? (lambda (a b) (not (string-ci>? a b))))
(define string-ci>=? (lambda (a b) (not (string-ci<? a b))))

(define string-append 
  (lambda strings
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
                           (copy (+ i 1)))))))))))

(define substring 
  (lambda (s start end)
    (let* ((len (- end start))
           (new-str (make-string len)))
      (let loop ((i 0))
        (if (= i len) new-str
            (begin (string-set! new-str i (string-ref s (+ start i)))
                   (loop (+ i 1))))))))

(define string-copy (lambda (s) (substring s 0 (string-length s))))

(define string-fill! 
  (lambda (s c)
    (let ((len (string-length s)))
      (let loop ((i 0))
        (if (= i len) s
            (begin (string-set! s i c)
                   (loop (+ i 1))))))))

;;; Vector procedures
(define vector-fill! 
  (lambda (v fill)
    (let ((len (vector-length v)))
      (let loop ((i 0))
        (if (= i len) v
            (begin (vector-set! v i fill)
                   (loop (+ i 1))))))))

(define vector->list 
  (lambda (v)
    (let ((len (vector-length v)))
      (let loop ((i (- len 1)) (res '()))
        (if (< i 0) res
            (loop (- i 1) (cons (vector-ref v i) res)))))))

(define list->vector 
  (lambda (lst)
    (let* ((len (length lst))
           (v (make-vector len)))
      (let loop ((l lst) (i 0))
        (if (null? l) v
            (begin (vector-set! v i (car l))
                   (loop (cdr l) (+ i 1))))))))

(define string->list 
  (lambda (s)
    (let ((len (string-length s)))
      (let loop ((i (- len 1)) (res '()))
        (if (< i 0) res
            (loop (- i 1) (cons (string-ref s i) res)))))))

(define list->string 
  (lambda (lst)
    (let* ((len (length lst))
           (s (make-string len)))
      (let loop ((l lst) (i 0))
        (if (null? l) s
            (begin (string-set! s i (car l))
                   (loop (cdr l) (+ i 1))))))))

;;; Higher-order functions
(define map 
  (lambda (proc list1 . lists)
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
                                (cons (cdr (car l)) (map-cdr (cdr l))))))))))))

(define for-each 
  (lambda (proc list1 . lists)
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
                                 (cons (cdr (car l)) (map-cdr (cdr l))))))))))))
