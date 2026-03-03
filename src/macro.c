#include <macro.h>
#include <stdlib.h>
#include <string.h>

static bool is_literal(Value* literals, Value* sym) {
    while (is_pair(literals)) {
        if (literals->as.pair.car == sym) return true;
        literals = literals->as.pair.cdr;
    }
    return false;
}

static bool is_ellipsis(Value* v) {
    return is_symbol(v) && strcmp(v->as.symbol, "...") == 0;
}

static void add_match(Value** matches, Value* var, Value* val, bool ellipsis) {
    if (ellipsis) {
        // If ellipsis, the value should be added to a list of values for that variable
        Value* existing = NULL;
        Value* m = *matches;
        while (is_pair(m)) {
            Value* pair = m->as.pair.car;
            if (pair->as.pair.car == var) {
                existing = pair;
                break;
            }
            m = m->as.pair.cdr;
        }
        if (existing) {
            // Append to the end of the list
            Value* list = existing->as.pair.cdr;
            if (is_nil(list)) {
                existing->as.pair.cdr = make_pair(val, make_nil());
            } else {
                while (is_pair(list->as.pair.cdr)) list = list->as.pair.cdr;
                list->as.pair.cdr = make_pair(val, make_nil());
            }
        } else {
            *matches = make_pair(make_pair(var, make_pair(val, make_nil())), *matches);
        }
    } else {
        *matches = make_pair(make_pair(var, val), *matches);
    }
}

static bool match_pattern(Value* pattern, Value* input, Value* literals, Value** matches, bool in_ellipsis) {
    if (is_symbol(pattern)) {
        if (strcmp(pattern->as.symbol, "_") == 0) return true;
        if (is_literal(literals, pattern)) {
            return (is_symbol(input) && pattern == input);
        }
        add_match(matches, pattern, input, in_ellipsis);
        return true;
    }
    if (is_pair(pattern)) {
        if (is_pair(pattern->as.pair.cdr) && is_ellipsis(pattern->as.pair.cdr->as.pair.car)) {
            // Pattern like (p ... . rest)
            Value* sub_pattern = pattern->as.pair.car;
            Value* rest_pattern = pattern->as.pair.cdr->as.pair.cdr;
            
            // Match sub_pattern as many times as possible
            while (is_pair(input)) {
                // We need to check if rest_pattern matches the remaining input.
                // This is a bit tricky with greedy matching.
                // Simple version: match sub_pattern as long as we can, then match rest.
                // But R5RS says ellipsis is greedy.
                
                // Let's try matching rest_pattern first (backtracking).
                // Actually, let's just match as many sub_patterns as we can.
                Value* temp_matches = *matches;
                if (match_pattern(sub_pattern, input->as.pair.car, literals, matches, true)) {
                    input = input->as.pair.cdr;
                } else {
                    *matches = temp_matches;
                    break;
                }
            }
            return match_pattern(rest_pattern, input, literals, matches, in_ellipsis);
        }
        if (!is_pair(input)) return false;
        return match_pattern(pattern->as.pair.car, input->as.pair.car, literals, matches, in_ellipsis) &&
               match_pattern(pattern->as.pair.cdr, input->as.pair.cdr, literals, matches, in_ellipsis);
    }
    
    if (pattern->type != input->type) return false;
    if (is_fixnum(pattern)) return pattern->as.fixnum == input->as.fixnum;
    if (is_boolean(pattern)) return pattern->as.boolean == input->as.boolean;
    if (is_char(pattern)) return pattern->as.character == input->as.character;
    if (is_string(pattern)) return strcmp(pattern->as.string.str, input->as.string.str) == 0;
    if (is_nil(pattern)) return is_nil(input);
    
    return false;
}

static Value* expand_template(Value* template, Value* matches, int ellipsis_idx) {
    if (is_symbol(template)) {
        Value* m = NULL;
        Value* curr = matches;
        while (is_pair(curr)) {
            Value* pair = curr->as.pair.car;
            if (pair->as.pair.car == template) {
                m = pair->as.pair.cdr;
                break;
            }
            curr = curr->as.pair.cdr;
        }
        if (m) {
            if (ellipsis_idx >= 0) {
                // If we are expanding an ellipsis, m should be a list
                if (is_pair(m)) {
                    Value* p = m;
                    for (int i = 0; i < ellipsis_idx && is_pair(p); i++) p = p->as.pair.cdr;
                    if (is_pair(p)) return p->as.pair.car;
                }
                return NULL; // Should not happen if pattern matched correctly
            }
            return m;
        }
        return template;
    }
    if (is_pair(template)) {
        if (is_pair(template->as.pair.cdr) && is_ellipsis(template->as.pair.cdr->as.pair.car)) {
            // (t ... . rest)
            Value* sub_template = template->as.pair.car;
            Value* rest_template = template->as.pair.cdr->as.pair.cdr;
            
            Value* res = make_nil();
            Value* tail = NULL;
            for (int i = 0; ; i++) {
                Value* expanded = expand_template(sub_template, matches, i);
                if (!expanded) break;
                Value* new_pair = make_pair(expanded, make_nil());
                if (!tail) {
                    res = new_pair;
                    tail = new_pair;
                } else {
                    tail->as.pair.cdr = new_pair;
                    tail = new_pair;
                }
            }
            Value* rest = expand_template(rest_template, matches, ellipsis_idx);
            if (!tail) return rest;
            tail->as.pair.cdr = rest;
            return res;
        }
        return make_pair(expand_template(template->as.pair.car, matches, ellipsis_idx),
                         expand_template(template->as.pair.cdr, matches, ellipsis_idx));
    }
    return template;
}

Value* macro_expand(Value* expr, Value* env) {
    (void)env;
    // Integration logic...
    return expr;
}

Value* macro_test_match_expand(Value* literals, Value* pattern, Value* input, Value* template) {
    Value* matches = make_nil();
    if (match_pattern(pattern, input, literals, &matches, false)) {
        return expand_template(template, matches, -1);
    }
    return NULL;
}
