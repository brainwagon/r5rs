CC = gcc
CFLAGS = -std=c99 -Wall -Wextra -Werror -Iinclude
LDFLAGS =

SRC_DIR = src
INC_DIR = include
OBJ_DIR = obj
TEST_DIR = tests
UNITY_DIR = tests/unity

SRCS = $(wildcard $(SRC_DIR)/*.c)
OBJS = $(patsubst $(SRC_DIR)/%.c, $(OBJ_DIR)/%.o, $(SRCS))

TEST_SRCS = $(wildcard $(TEST_DIR)/*.c)
TEST_BINS = $(patsubst $(TEST_DIR)/%.c, $(TEST_DIR)/%, $(TEST_SRCS))

UNITY_SRC = $(UNITY_DIR)/unity.c
UNITY_OBJ = $(OBJ_DIR)/unity.o

.PHONY: all clean test

all: $(OBJS)

$(OBJ_DIR)/%.o: $(SRC_DIR)/%.c | $(OBJ_DIR)
	$(CC) $(CFLAGS) -c $< -o $@

$(OBJ_DIR):
	mkdir -p $(OBJ_DIR)

$(UNITY_OBJ): $(UNITY_SRC) | $(OBJ_DIR)
	$(CC) $(CFLAGS) -I$(UNITY_DIR) -c $< -o $@

test: $(TEST_BINS)
	@for bin in $(TEST_BINS); do ./$$bin; done

$(TEST_DIR)/%: $(TEST_DIR)/%.c $(OBJS) $(UNITY_OBJ)
	$(CC) $(CFLAGS) -I$(UNITY_DIR) $^ -o $@

clean:
	rm -rf $(OBJ_DIR) $(TEST_BINS)
