CC = gcc
CFLAGS = -std=c99 -Wall -Wextra -Werror -Iinclude -fprofile-arcs -ftest-coverage
LDFLAGS = -lgcov

SRC_DIR = src
INC_DIR = include
OBJ_DIR = obj
TEST_DIR = tests
UNITY_DIR = tests/unity

SRCS = $(wildcard $(SRC_DIR)/*.c)
OBJS = $(patsubst $(SRC_DIR)/%.c, $(OBJ_DIR)/%.o, $(SRCS))

TEST_SRCS = $(wildcard $(TEST_DIR)/test_*.c)
TEST_BINS = $(patsubst $(TEST_DIR)/%.c, $(TEST_DIR)/%, $(TEST_SRCS))

UNITY_SRC = $(UNITY_DIR)/unity.c
UNITY_OBJ = $(OBJ_DIR)/unity.o

all: scheme $(TEST_BINS)

scheme: $(OBJS)
	$(CC) $(CFLAGS) $^ -o $@ $(LDFLAGS)

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
	rm -rf $(OBJ_DIR) $(TEST_BINS) scheme *.gcov

.PHONY: all test clean
