import { createError } from "../middlewares/errorHandler.js"; // errorHandler'dan createError fonksiyonunu import ediyoruz
import cloudinary from 'cloudinary';
import sharp from 'sharp';
import User from '../models/userModel.js'; // User modelini import ediyoruz
import Post from "../models/postModel.js";
import { deleteFromCloudinary } from "../database/cloudinary.config.js";
import { Comment, subComment } from "../models/commentModel.js"


cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});



class userCtrl {
    // Create Businesses

    static register = async (req, res, next) => {
        try {
            const newUser = await User.create(req.body);
            res.status(200).json({
                message: "Kullanıcı başarıyla oluşturuldu",
                data: newUser
            });
        } catch (error) {
            next(createError(500, "bir sorun oluştu")); // Hata meydana geldiğinde hata işleyiciyi çağır
        }
    }
    // Update Businesses

    static update = async (req, res, next) => {
        try {
            const { id } = req.params;
            const updatedUser = await User.findByIdAndUpdate(id, req.body, { new: true });
            if (!updatedUser) {
                throw createError(404, 'Kullanıcı bulunamadı');
            }
            res.status(200).json({
                message: "Kullanıcı başarıyla güncellendi",
                data: updatedUser
            });
        } catch (error) {
            next(error); // Hata meydana geldiğinde hata işleyiciyi çağır
        }
    }
    // Delete Businesses

    static delete = async (req, res, next) => {
        try {
            const { id } = req.params;
            const deletedUser = await User.findByIdAndDelete(id);
            if (!deletedUser) {
                throw createError(404, 'Kullanıcı bulunamadı');
            }
            res.status(200).json({
                success: true,
                message: "Kullanıcı başarıyla silindi",
                data: deletedUser
            });
        } catch (error) {
            next(error); // Hata meydana geldiğinde hata işleyiciyi çağır
        }
    }
    // Get  Businesses

    static get = async (req, res, next) => {
        try {
            const { id } = req.params;
            const aUser = await User.findOne({ _id: id });
            if (!aUser) {
                throw createError(404, 'Kullanıcı bulunamadı');
            }
            res.status(200).json({
                success: true,
                data: aUser
            });
        } catch (error) {
            next(error); // Hata meydana geldiğinde hata işleyiciyi çağır
        }
    }
    // Get all Businesses
    static getAll = async (req, res, next) => {
        try {
            const allUsers = await User.find();
            res.status(200).json({
                success: true,
                data: allUsers
            });
        } catch (error) {
            next(error); // Hata meydana geldiğinde hata işleyiciyi çağır
        }
    }
    // Upload Image
    static uploadImage = async (req, res, next) => {
        try {
            const file = req.file;

            if (!file) {
                return next(createError(400, 'No file uploaded'));
            }

            // Resize the image using Sharp
            const resizedBuffer = await sharp(file.buffer)
                .resize(800, 800, { fit: 'inside' })
                .toBuffer();

            cloudinary.v2.uploader.upload_stream({ resource_type: 'image', folder: 'SuperAPI' }, (error, result) => {
                if (error) {
                    return next(createError(500, 'Upload failed: ' + error.message));
                }
                res.status(200).json({ url: result.secure_url, id: result.public_id });
            }).end(resizedBuffer);
        } catch (error) {
            next(createError(500, 'Upload failed: ' + error.message));
        }
    }
    // Delete image
    static deleteImage = async (req, res, next) => {
        try {
            const { id } = req.body;
            if (!id) {
                return next(createError(400, 'No public_id provided'));
            }

            cloudinary.v2.uploader.destroy(id, (error, result) => {
                if (error) {
                    return next(createError(500, 'Deletion failed: ' + error.message));
                }
                res.status(200).json({ message: 'File deleted successfully' });
            });
        } catch (error) {
            next(createError(500, 'Deletion failed: ' + error.message));
        }
    }
    // Create Post
    static createPost = async (req, res, next) => {
        const { id } = req.user;
        const { content } = req.body;
        const file = req.file;

        try {
            const user = await User.findById(id);
            if (!user) {
                throw createError(404, 'Kullanıcı bulunamadı');
            }

            let mediaUrl = null;
            if (file) {
                // Resize the image using Sharp
                const resizedBuffer = await sharp(file.buffer)
                    .resize(800, 800, { fit: 'inside' })
                    .toBuffer();

                // Upload to Cloudinary
                const uploadStream = cloudinary.v2.uploader.upload_stream({ resource_type: 'image', folder: 'SuperAPI/Post' }, async (error, result) => {
                    if (error) {
                        return next(createError(500, 'Upload failed: ' + error.message));
                    }
                    mediaUrl = {
                        url: result.secure_url,
                        public_id: result.public_id
                    };

                    // Create post after upload
                    const post = await Post.create({
                        content,
                        author: user._id,
                        media: mediaUrl
                    });
                    res.json({ user, post });
                });
                uploadStream.end(resizedBuffer);
            } else {
                // Create post without media
                const post = new Post({
                    content,
                    author: user._id
                });
                await post.save()
                user.posts.push(post._id)
                await user.save();
                res.json({ user, post });
            }
        } catch (error) {
            next(createError(500, 'Paylaşım yaparken hata oluştu: ' + error.message));
        }
    };
    // updatePost metodu
    static updatePost = async (req, res, next) => {
        const { _id } = req.params;
        const { id } = req.user;
        const { content } = req.body;
        const file = req.file;

        try {

            const user = await User.findById(id);
            if (!user) {
                return next(createError(404, 'Kullanıcı bulunamadı'));
            }

            const post = await Post.findById(_id);
            if (!post) {
                return next(createError(404, 'Paylaşım bulunamadı'));
            }
            let media = null;
            if (file) {
                // Eski medyayı Cloudinary'den sil
                if (post.media && post.media.public_id) {
                    await deleteFromCloudinary(post.media.public_id);
                }
                // Yeni resmi boyutlandır ve Cloudinary'e yükle
                const resizedBuffer = await sharp(file.buffer)
                    .resize({ width: 800, height: 800, fit: 'inside' })
                    .toBuffer();

                const result = await cloudinary.v2.uploader.upload(resizedBuffer, {
                    resource_type: 'image',
                    folder: 'SuperAPI/Post'
                });
                media = {
                    url: result.secure_url,
                    public_id: result.public_id
                };
            }
            // Post içeriğini ve medya bilgisini güncelle
            post.content = content;
            if (media) {
                post.media = media;
            }
            const index = user.posts.findIndex(p => p.toString() === post._id.toString())
            if (index !== -1) {
                user.posts[index] = post._id
                await user.save();
            }
            await post.save();

            // Kullanıcının postlarını güncelle
            res.json({ user, post });
        } catch (error) {
            next(createError(500, 'Paylaşım güncellerken bir hata oluştu', error));
        }
    };
    // deletePost metodu
    static deletePost = async (req, res, next) => {
        const { _id } = req.params; // Silinecek postun ID'si
        const { id } = req.user; // İşlemi yapan kullanıcının ID'si


        try {
            // Kullanıcıyı bul
            const user = await User.findById(id);
            if (!user) {
                return next(createError(404, 'Kullanıcı bulunamadı'));
            }

            // Post'u bul ve sil
            const post = await Post.findById(_id);
            if (!post) {
                return next(createError(404, 'Post bulunamadı'));
            }

            // Cloudinary'den medyayı sil (varsa)
            if (post.media && post.media?.public_id) {
                await deleteFromCloudinary(post.media?.public_id);
            }

            // Post'u veritabanından sil
            await Post.findByIdAndDelete(_id)

            // Kullanıcının postlarını güncelle
            user.posts = user.posts.filter(p => p._id.toString() !== _id.toString());
            await user.save();
            console.log(user.posts);

            res.json({ message: 'Post başarıyla silindi' });
        } catch (error) {
            next(createError(500, 'Post silinirken bir hata oluştu', error));
        }
    };
    // get a Post
    static getPost = async (req, res, next) => {
        const { _id } = req.params; // Getirilecek postun ID'si

        try {
            // Post'u bul
            const post = await Post.findById(_id);
            if (!post) {
                return next(createError(404, 'Post bulunamadı'));
            }

            // Postu kullanıcıya gönder
            res.json(post);
        } catch (error) {
            next(createError(500, 'Post getirilirken bir hata oluştu', error.message));
        }
    };
    // Get All Posts
    static getAllPost = async (req, res, next) => {

        console.log("buraya düştü");
        try {
            // Postları veritabanından getir
            const posts = await Post.find();
            if (!posts) {
                return next(createError(404, 'Post bulunamadı'));
            }

            // Postları kullanıcıya gönder
            res.json(posts);
        } catch (error) {
            next(createError(500, 'Post getirilirken bir hata oluştu', error.message));
        }
    };

    // likePost metodu
    static likePost = async (req, res, next) => {
        const { _id } = req.params; // Beğenilecek postun ID'si
        const { id } = req.user; // İşlemi yapan kullanıcının ID'si

        try {
            // Kullanıcıyı bul
            const user = await User.findById(id);
            if (!user) {
                return next(createError(404, 'Kullanıcı bulunamadı'));
            }

            // Post'u bul
            const post = await Post.findById(_id);
            if (!post) {
                return next(createError(404, 'Post bulunamadı'));
            }


            // Post'un likes dizisini kontrol et
            const likeIndex = post.likes?.findIndex(id => id.toString() === user._id.toString());
            const likePostIndex = user.likePost?.findIndex(id => id.toString() === user._id.toString());
            if (likeIndex === -1) {
                // Kullanıcı postu beğenmemişse, beğeni ekle
                post.likes.push(id);
            } else {
                // Kullanıcı postu zaten beğenmişse, beğeniyi kaldır
                post.likes.splice(likeIndex, 1);
            }
            if (likePostIndex === -1) {
                // Kullanıcı postu beğenmemişse, beğeni ekle
                user.likePost.push(post._id);
            } else {
                // Kullanıcı postu zaten beğenmişse, beğeniyi kaldır
                user.likePost.splice(likePostIndex, 1);
            }

            // Post'u kaydet
            await post.save();

            res.json({ message: 'Beğeni durumu güncellendi', post });
        } catch (error) {
            next(createError(500, 'Beğeni durumu güncellenirken bir hata oluştu', error.message));
        }

    };
    // Create Comment
    static commentPost = async (req, res, next) => {
        const { postId } = req.params; // Yorum yapılacak postun ID'si
        const { id } = req.user; // İşlemi yapan kullanıcının ID'si
        const { content } = req.body; // Yorum içeriği
        console.log(req.body)
        try {
            // Kullanıcıyı bul
            const user = await User.findById(id);
            if (!user) {
                return next(createError(404, 'Kullanıcı bulunamadı'));
            }

            // Post'u bul
            const post = await Post.findById(postId);
            if (!post) {
                return next(createError(404, 'Post bulunamadı'));
            }
            // Yeni bir yorum oluştur
            const comment = new Comment({
                content,
                author: user._id,
                postId: post._id
            });

            // Yorumu kaydet
            await comment.save();

            res.json({ message: 'Yorum başarıyla eklendi', comment });
        } catch (error) {
            next(createError(500, 'Yorum eklenirken bir hata oluştu', error.message));
        }
    };
    // update Comment
    static updateCommentPost = async (req, res, next) => {
        const { commentId } = req.params
        const { id } = req.user
        const { content } = req.body
        try {
            const user = await User.findById(id)
            if (!user) {
                next(createError(404, "Kullanıcı bulunmadı"))
            }
            const comment = await Comment.findByIdAndUpdate(commentId, { content }, { new: true })
            if (!comment) {
                next(createError(404, "Yorum bulunmadı"))
            }
            const post = await Post.findOne({ _id: comment.postId })
            if (!post) {
                next(createError(404, "Bu yorum sana ait değil"))
            }


            res.json({
                comment
            })
        } catch (error) {
            next(createError(500, "Yorum güncellerken hata oluştu", error.message))
        }
    }
    // Delete Comment
    static deleteCommentPost = async (req, res, next) => {
        const { commentId } = req.params;
        const { id } = req.user;

        try {

            const user = await User.findById(id)
            if (!user) {
                return next(createError(404, "Kullanıcı bulunamadı"));
            }
            // Post'u güncelle


            // Yorumu bul ve sil
            const comment = await Comment.findOne({ _id: commentId, author: id });
            if (!comment) {
                return next(createError(404, "Yorum bulunamadı"));
            }
            const post = await Post.findById(comment.postId);
            if (!post) {
                return next(createError(404, "Paylaşım bulunamadı"));
            }

            await comment.deleteOne()




            res.json({ message: "Yorum başarıyla silindi" });
        } catch (error) {
            next(createError(500, "Yorum silinirken bir hata oluştu: " + error.message));
        }
    };

    // Get All Comment
    static getAllComment = async (req, res, next) => {
        try {

            const comments = await Comment.find()

            res.json(comments)
        } catch (error) {
            next(createError(500, "Bütün yorumları alırken hata oluştu", error.message))
        }
    }

    // Like Comment
    static likeComment = async (req, res, next) => {
        const { commentId } = req.params
        const { id } = req.user
        try {
            const comment = await Comment.findById(commentId)
            if (!comment) {
                next(createError(404, "Yorum bulunmadı"))
            }
            const user = await User.findById(id)
            if (!user) {
                next(createError(404, "kullanıcı bulunmadı"))
            }
            if (comment.likes.includes(id)) {

                comment.likes.pull(id)
            } else {
                comment.likes.push(id)

            }
            await comment.save()
            res.json(comment)

        } catch (error) {
            next(createError(500, "Yorumu beğenirken hata oluştu", error.message))
        }
    }

    // A comment comment
    static subComment = async (req, res, next) => {
        const { commentId } = req.params
        const { id } = req.user
        const { content } = req.body
        try {

            const user = await User.findById(id)
            if (!user) {
                next(createError(404, "Kullanıcı bulunmadı"))

            }
            const comment = await Comment.findById(commentId)
            if (!comment) {
                next(createError(404, "Yorum bulunmadı"))
            }

            const subcomment = await subComment.create({ content: content, author: id, commentId: comment._id })
            comment.subComments.push(subcomment)
            await comment.save()
            res.json(comment)

        } catch (error) {
            next(createError(500, "Yorum yorumlanırken hata oluştu", error.message))
        }
    }

    // Update subComment
    static updateSubComment = async (req, res, next) => {
        const { scommentId } = req.params
        const { id } = req.user
        const { content } = req.body

        try {
            const user = await User.findById(id)
            if (!user) {
                next(createError(404, "Kullanıcı bulunmadı"))

            }
            const subcomment = await subComment.findById(scommentId)
            if (!subcomment) {
                next(createError(404, "alt yorum bulunmadı"))
            }
            const comment = await Comment.findById(subcomment.commentId)
            if (!comment) {
                next(createError(404, "Alt yorum değiştirmek için yorum bulunmadı"))
            }

            subcomment.content = content
            await subcomment.save()
            const index = comment.subComments.findIndex(s => s._id.toString() === subcomment._id.toString())
            if (index != -1) {
                comment.subComments[index] = subcomment
                await comment.save()

            }

            res.json(comment)
        } catch (error) {
            next(createError(500, "alt yorum güncellenirken hata oluştu", error.message))
        }
    }

    // Delete subComment
    static deleteSubComment = async (req, res, next) => {
        const { scommentId } = req.params
        const { id } = req.user
        try {
            const user = await User.findById(id)
            if (!user) {
                next(createError(404, "Kullanıcı bulunmadı"))

            }
            const subcomment = await subComment.findById(scommentId)
            if (!subcomment) {
                next(createError(404, "alt yorum bulunmadı"))
            }

            const comment = await Comment.findById(subcomment.commentId)
            if (!comment) {
                next(createError(404, "Alt yorum değiştirmek için yorum bulunmadı"))
            }
            comment.subComments.pull(subcomment)
            await comment.save()
            await subcomment.deleteOne()
            res.json({
                message: "Alt yorum silindi"
            })

        } catch (error) {
            next(createError(500, "Alt yorum silinirken hata oluştu", error.message))
        }
    }


    // Like subComment
    static likeSubComment = async (req, res, next) => {
        const { scommentId } = req.params
        const { id } = req.user
        try {

            const user = await User.findById(id)
            if (!user) {
                next(createError(404, "kullanıcı bulunmadı"))
            }

            const subcomment = await subComment.findById(scommentId)
            if (!subcomment) {
                next(createError(404, "Alt yorum bulunmadı"))
            }
            const comment = await Comment.findById(subcomment.commentId)
            if (!comment) {
                next(createError(404, "Yorum bulunmadı"))
            }
            const index = comment.subComments.findIndex(s => s._id.toString() === subcomment._id.toString())

            if (subcomment.likes.includes(id)) {
                subcomment.likes.pull(id)
                await subcomment.save()

                if (index != -1) {
                    comment.subComments[index].likes = subcomment.likes
                    await comment.save()
                }
            } else {
                subcomment.likes.push(id)
                await subcomment.save()
                if (index != -1) {
                    comment.subComments[index].likes = subcomment.likes
                    await comment.save()
                }
            }
            res.json(comment)

        } catch (error) {
            next(createError(500, "Yorumu beğenirken hata oluştu", error.message))
        }
    }
}



export default userCtrl;
