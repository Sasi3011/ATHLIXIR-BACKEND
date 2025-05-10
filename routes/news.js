const express = require('express');
const router = express.Router();
const axios = require('axios');

// NewsAPI configuration
const API_KEY = "89aa844281544a50908a34eea036daa4";
const BASE_URL = "https://newsapi.org/v2";

/**
 * @route   GET /api/news/sports
 * @desc    Get all sports news (proxy for NewsAPI)
 * @access  Public
 */
router.get('/sports', async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    
    const response = await axios.get(`${BASE_URL}/everything`, {
      params: {
        q: "sports",
        language: "en",
        sortBy: "publishedAt",
        apiKey: API_KEY,
        page,
        pageSize,
      },
    });
    
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching sports news:", error);
    
    // If API fails, return a 500 error
    if (error.response) {
      return res.status(error.response.status).json({
        message: 'Error fetching news from external API',
        error: error.response.data
      });
    }
    
    res.status(500).json({ message: 'Server error fetching news' });
  }
});

/**
 * @route   GET /api/news/category/:category
 * @desc    Get news by sport category (proxy for NewsAPI)
 * @access  Public
 */
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, pageSize = 10 } = req.query;
    
    const response = await axios.get(`${BASE_URL}/everything`, {
      params: {
        q: category,
        language: "en",
        sortBy: "publishedAt",
        apiKey: API_KEY,
        page,
        pageSize,
      },
    });
    
    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching ${req.params.category} news:`, error);
    
    if (error.response) {
      return res.status(error.response.status).json({
        message: 'Error fetching category news from external API',
        error: error.response.data
      });
    }
    
    res.status(500).json({ message: 'Server error fetching category news' });
  }
});

/**
 * @route   GET /api/news/trending
 * @desc    Get trending sports news (proxy for NewsAPI)
 * @access  Public
 */
router.get('/trending', async (req, res) => {
  try {
    const { pageSize = 5 } = req.query;
    
    const response = await axios.get(`${BASE_URL}/top-headlines`, {
      params: {
        category: "sports",
        language: "en",
        apiKey: API_KEY,
        pageSize,
      },
    });
    
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching trending news:", error);
    
    if (error.response) {
      return res.status(error.response.status).json({
        message: 'Error fetching trending news from external API',
        error: error.response.data
      });
    }
    
    res.status(500).json({ message: 'Server error fetching trending news' });
  }
});

/**
 * @route   GET /api/news/search
 * @desc    Search news by keyword (proxy for NewsAPI)
 * @access  Public
 */
router.get('/search', async (req, res) => {
  try {
    const { query, page = 1, pageSize = 10 } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const response = await axios.get(`${BASE_URL}/everything`, {
      params: {
        q: query,
        language: "en",
        sortBy: "publishedAt",
        apiKey: API_KEY,
        page,
        pageSize,
      },
    });
    
    res.json(response.data);
  } catch (error) {
    console.error("Error searching news:", error);
    
    if (error.response) {
      return res.status(error.response.status).json({
        message: 'Error searching news from external API',
        error: error.response.data
      });
    }
    
    res.status(500).json({ message: 'Server error searching news' });
  }
});

module.exports = router;
