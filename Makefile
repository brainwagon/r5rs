CC = gcc
EMCC = emcc
CFLAGS = -std=c99 -Wall -Wextra -Werror -Iinclude -fprofile-arcs -ftest-coverage
EMFLAGS = -std=c99 -Wall -Wextra -Iinclude -s WASM=1 -s NO_EXIT_RUNTIME=1 -s "EXPORTED_RUNTIME_METHODS=['ccall', 'cwrap']" -s "EXPORTED_FUNCTIONS=['_malloc', '_free', '_main', '_init_scheme', '_exec_scheme']" -s SINGLE_FILE=1 --embed-file prelude.scm

SRC_DIR = src
INC_DIR = include
OBJ_DIR = obj
WEB_DIR = web
TEST_DIR = tests
UNITY_DIR = tests/unity

SRCS = $(filter-out $(SRC_DIR)/web_main.c, $(wildcard $(SRC_DIR)/*.c))
OBJS = $(patsubst $(SRC_DIR)/%.c, $(OBJ_DIR)/%.o, $(SRCS))
WEB_SRCS = $(filter-out $(SRC_DIR)/main.c $(SRC_DIR)/terminal.c, $(wildcard $(SRC_DIR)/*.c))

TEST_SRCS = $(wildcard $(TEST_DIR)/test_*.c)
TEST_BINS = $(patsubst $(TEST_DIR)/%.c, $(TEST_DIR)/%, $(TEST_SRCS))

UNITY_SRC = $(UNITY_DIR)/unity.c
UNITY_OBJ = $(OBJ_DIR)/unity.o

all: scheme $(TEST_BINS)

scheme: $(OBJS)
	$(CC) $(CFLAGS) $^ -o $@ $(LDFLAGS)

web: $(WEB_DIR)/scheme.js $(WEB_DIR)/web_worker.js

$(WEB_DIR)/scheme.js: $(WEB_SRCS)
	@mkdir -p $(WEB_DIR)
	$(EMCC) $(EMFLAGS) $^ -o $@

$(WEB_DIR)/web_worker.js: $(SRC_DIR)/web_worker.js
	@mkdir -p $(WEB_DIR)
	cp $< $@

$(OBJ_DIR)/%.o: $(SRC_DIR)/%.c
	@mkdir -p $(OBJ_DIR)
	$(CC) $(CFLAGS) -c $< -o $@

$(UNITY_OBJ): $(UNITY_SRC)
	@mkdir -p $(OBJ_DIR)
	$(CC) $(CFLAGS) -I$(UNITY_DIR) -c $< -o $@

test: $(TEST_BINS)
	@for bin in $(TEST_BINS); do ./$$bin; done

test-pervasive: $(TEST_DIR)/test_pervasive
	./$<

$(TEST_DIR)/%: $(TEST_DIR)/%.c $(filter-out $(OBJ_DIR)/main.o, $(OBJS)) $(UNITY_OBJ)
	$(CC) $(CFLAGS) -I$(UNITY_DIR) $^ -o $@ $(LDFLAGS)

clean:
	rm -rf $(OBJ_DIR) $(WEB_DIR) $(TEST_BINS) scheme *.gcov

.PHONY: all test clean
