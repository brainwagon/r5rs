#include <macro.h>
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

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
        Value* existing = NULL;
        Value* m = *matches;
        while (is_pair(m)) {
            Value* pair = m->as.pair.car;
            if (pair->as.pair.car == var) { existing = pair; break; }
            m = m->as.pair.cdr;
        }
        if (existing) {
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
            Value* sub_pattern = pattern->as.pair.car;
            Value* rest_pattern = pattern->as.pair.cdr->as.pair.cdr;
            while (is_pair(input)) {
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

static Value* gensym(const char* base) {
    static int counter = 0;
    char buf[128];
    sprintf(buf, "%%gen-%s-%d", base, counter++);
    return make_symbol(buf);
}

static bool is_core_keyword(const char* name) {
    const char* keywords[] = {"if", "define", "set!", "lambda", "quote", "begin", "call/cc", "call-with-current-continuation", "let", "let*", "letrec", "cond", "and", "or", "case", "define-syntax", "let-syntax", "letrec-syntax", "list", NULL};
    for (int i = 0; keywords[i]; i++) {
        if (strcmp(name, keywords[i]) == 0) return true;
    }
    return false;
}

static Value* expand_template(Value* template, Value* matches, int ellipsis_idx, Value* literals, Value** rename_map, Value* macro_name) {
    if (is_symbol(template)) {
        Value* m = NULL;
        Value* curr = matches;
        while (is_pair(curr)) {
            Value* pair = curr->as.pair.car;
            if (pair->as.pair.car == template) { m = pair->as.pair.cdr; break; }
            curr = curr->as.pair.cdr;
        }
        if (m) {
            if (ellipsis_idx >= 0) {
                if (is_pair(m)) {
                    Value* p = m;
                    for (int i = 0; i < ellipsis_idx && is_pair(p); i++) p = p->as.pair.cdr;
                    if (is_pair(p)) return p->as.pair.car;
                }
                return NULL;
            }
            return m;
        }
        
        // Don't rename macro name (for recursion)
        if (template == macro_name) return template;

        // CRITICAL: We only rename identifiers that are NOT literals and NOT core keywords.
        // But we should only rename them if they are introduced by the macro (i.e. in the template but not in matches).
        if (is_core_keyword(template->as.symbol) || is_literal(literals, template)) {
            return template;
        }

        Value* rm = *rename_map;
        while (is_pair(rm)) {
            if (rm->as.pair.car->as.pair.car == template) return rm->as.pair.car->as.pair.cdr;
            rm = rm->as.pair.cdr;
        }
        Value* new_sym = gensym(template->as.symbol);
        *rename_map = make_pair(make_pair(template, new_sym), *rename_map);
        return new_sym;
    }
    if (is_pair(template)) {
        if (is_pair(template->as.pair.cdr) && is_ellipsis(template->as.pair.cdr->as.pair.car)) {
            Value* sub_template = template->as.pair.car;
            Value* rest_template = template->as.pair.cdr->as.pair.cdr;
            Value* res = make_nil();
            Value* tail = NULL;
            for (int i = 0; ; i++) {
                Value* expanded = expand_template(sub_template, matches, i, literals, rename_map, macro_name);
                if (!expanded) break;
                Value* new_pair = make_pair(expanded, make_nil());
                if (!tail) { res = new_pair; tail = new_pair; }
                else { tail->as.pair.cdr = new_pair; tail = new_pair; }
            }
            Value* rest = expand_template(rest_template, matches, ellipsis_idx, literals, rename_map, macro_name);
            if (!tail) return rest;
            tail->as.pair.cdr = rest;
            return res;
        }
        Value* car = expand_template(template->as.pair.car, matches, ellipsis_idx, literals, rename_map, macro_name);
        Value* cdr = expand_template(template->as.pair.cdr, matches, ellipsis_idx, literals, rename_map, macro_name);
        return make_pair(car, cdr);
    }
    return template;
}

Value* macro_expand_with_transformer(Value* transformer, Value* expr) {
    if (!is_macro(transformer)) return expr;
    Value* literals = transformer->as.macro.literals;
    Value* rules = transformer->as.macro.rules;
    Value* macro_name = is_pair(expr) ? expr->as.pair.car : NULL;
    while (is_pair(rules)) {
        Value* rule = rules->as.pair.car;
        Value* pattern = rule->as.pair.car;
        Value* template = rule->as.pair.cdr->as.pair.car;
        Value* matches = make_nil();
        if (is_pair(pattern) && is_pair(expr)) {
            if (match_pattern(pattern->as.pair.cdr, expr->as.pair.cdr, literals, &matches, false)) {
                Value* rename_map = make_nil();
                return expand_template(template, matches, -1, literals, &rename_map, macro_name);
            }
        }
        rules = rules->as.pair.cdr;
    }
    return expr;
}

Value* macro_test_match_expand(Value* literals, Value* pattern, Value* input, Value* template) {
    Value* matches = make_nil();
    if (match_pattern(pattern, input, literals, &matches, false)) {
        Value* rename_map = make_nil();
        return expand_template(template, matches, -1, literals, &rename_map, NULL);
    }
    return NULL;
}
