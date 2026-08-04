export const paginate = async (model, query = {}, options = {}) => {
  const {
    page = 1,
    limit = 10,
    sort = '-createdAt',
    search,
    searchFields = [],
    filter = {},
    populate,
  } = options;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const filterQuery = { ...query };

  if (search && searchFields.length > 0) {
    filterQuery.$or = searchFields.map((field) => ({
      [field]: { $regex: search, $options: 'i' },
    }));
  }

  if (filter && typeof filter === 'object') {
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        filterQuery[key] = value;
      }
    });
  }

  let queryBuilder = model.find(filterQuery).sort(sort).skip(skip).limit(limitNum);
  if (populate) {
    const populateList = Array.isArray(populate) ? populate : [populate];
    populateList.forEach((p) => { queryBuilder = queryBuilder.populate(p); });
  }

  const [data, total] = await Promise.all([
    queryBuilder,
    model.countDocuments(filterQuery),
  ]);

  return {
    data,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      hasNextPage: pageNum * limitNum < total,
      hasPrevPage: pageNum > 1,
    },
  };
};
