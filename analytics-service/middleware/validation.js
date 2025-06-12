function validateRequest(schema, source = 'body') {
  return (req, res, next) => {
    const data = source === 'params' ? req.params :
                  source === 'query' ? req.query : req.body;

    const { error } = schema.validate(data);

    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    next();
  };
}

module.exports = { validateRequest };
