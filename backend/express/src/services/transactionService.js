import prisma from "./prisma.js";

/**
 * Create a new transaction
 */
export const createTransaction = async (transactionData) => {
  return await prisma.transaction.create({
    data: {
      date: new Date(transactionData.date),
      description: transactionData.description || null,
      amount: transactionData.amount,
      merchant: transactionData.merchant,
      category: transactionData.category || null,
      aiCategory: transactionData.aiCategory || null,
      anomalyFlag: transactionData.anomalyFlag || false,
      reason: transactionData.reason || null,
    },
  });
};

/**
 * Create multiple transactions in bulk
 */
export const createTransactionsBulk = async (transactions) => {
  return await prisma.transaction.createMany({
    data: transactions.map((t) => ({
      date: new Date(t.date),
      description: t.description || null,
      amount: t.amount,
      merchant: t.merchant,
      category: t.category || null,
      aiCategory: t.aiCategory || null,
      anomalyFlag: t.anomalyFlag || false,
      reason: t.reason || null,
    })),
    skipDuplicates: true,
  });
};

/**
 * Get transactions with filters
 */
export const getTransactions = async (filters = {}) => {
  const where = {};

  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) {
      where.date.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.date.lte = new Date(filters.endDate);
    }
  }

  if (filters.merchant) {
    where.merchant = { contains: filters.merchant, mode: "insensitive" };
  }

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.aiCategory) {
    where.aiCategory = filters.aiCategory;
  }

  if (filters.anomalyFlag !== undefined) {
    where.anomalyFlag = filters.anomalyFlag;
  }

  return await prisma.transaction.findMany({
    where,
    orderBy: { date: "desc" },
    take: filters.limit || 100,
    skip: filters.skip || 0,
  });
};

/**
 * Get transaction by ID
 */
export const getTransactionById = async (id) => {
  return await prisma.transaction.findUnique({
    where: { id },
  });
};

/**
 * Update transaction
 */
export const updateTransaction = async (id, updateData) => {
  const data = {};

  if (updateData.date) data.date = new Date(updateData.date);
  if (updateData.description !== undefined) data.description = updateData.description;
  if (updateData.amount !== undefined) data.amount = updateData.amount;
  if (updateData.merchant) data.merchant = updateData.merchant;
  if (updateData.category !== undefined) data.category = updateData.category;
  if (updateData.aiCategory !== undefined) data.aiCategory = updateData.aiCategory;
  if (updateData.anomalyFlag !== undefined) data.anomalyFlag = updateData.anomalyFlag;
  if (updateData.reason !== undefined) data.reason = updateData.reason;

  return await prisma.transaction.update({
    where: { id },
    data,
  });
};

/**
 * Delete transaction
 */
export const deleteTransaction = async (id) => {
  return await prisma.transaction.delete({
    where: { id },
  });
};

/**
 * Get transaction statistics
 */
export const getTransactionStats = async (filters = {}) => {
  const where = {};

  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) {
      where.date.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.date.lte = new Date(filters.endDate);
    }
  }

  const [total, totalAmount, anomalyCount] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.aggregate({
      where,
      _sum: { amount: true },
    }),
    prisma.transaction.count({
      where: { ...where, anomalyFlag: true },
    }),
  ]);

  return {
    total,
    totalAmount: totalAmount._sum.amount || 0,
    averageAmount: total > 0 ? totalAmount._sum.amount / total : 0,
    anomalyCount,
  };
};

