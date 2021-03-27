using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Hellmade.Sound;

public class ThreeDMovement : MonoBehaviour
{
    [SerializeField]
    float groundedMoveSpeed = 4f, jumpMoveSpeed = 5f, jumpHeight = 3f, gravity = -9.81f, rotateSpeed = 1f;
    [SerializeField]
    UpdateRespawnPoint respawnPoint;

    private float _moveSpeed;

    Vector3 velocity;
    bool isGrounded, isMovingGrounded;
    public bool leftMovingGround = true;

    public bool playWalkSound;
    public bool playJumpSound;


    public Transform groundCheck;
    public float groundCheckRadius = 0.4f;
    public LayerMask groundMask, movingGroundMask;

    public CharacterController controller;
    public Animator anim;

    private bool _jumpedAnimPlayed = false;
    Collider curMovingGround = null;

    private void Start()
    {
        
    }


    private void OnDisable()
    {
        playWalkSound = false;
        playJumpSound = false;
        anim.SetBool("isRunning", false);
        anim.SetBool("jumped", false);
    }

    private void Update()
    {
        // Create sphere and check if it collides with the ground layer.
        isGrounded = Physics.CheckSphere(groundCheck.position, groundCheckRadius, groundMask);

        // Create sphere and check if it collides with the moving ground layer.
        Collider[] collided = Physics.OverlapSphere(groundCheck.position, groundCheckRadius, movingGroundMask);
        isMovingGrounded = collided.Length > 0;

        if (isMovingGrounded && velocity.y <= 0)
        {
            curMovingGround = collided[0];
            // Whenever grounded, update respawn position to the moving grounded's child position
            this.transform.parent = collided[0].gameObject.transform;
            leftMovingGround = false;
        } else
        {
            
            this.transform.parent = null;
        }

        if (!leftMovingGround)
        {
            respawnPoint.updateRespawnPosition(curMovingGround.gameObject.transform.GetChild(1).transform.position);
        }

        if (isGrounded && velocity.y <= 0)
        {
            
            // Whenever grounded, update respawn position if its static ground
            if (!isMovingGrounded)
            {
                leftMovingGround = true;
                respawnPoint.updateRespawnPosition(transform.position);
                curMovingGround = null;
                // -2 to force the player on the ground a bit if not on moving ground (doing this on mnoving ground bounces the player)
                velocity.y = -2f;
            } else
            {
                velocity.y = 0f;
            }
            
            
            _moveSpeed = groundedMoveSpeed;
        } else
        {
            _moveSpeed = jumpMoveSpeed;
        }


        var targetVector = new Vector3(Input.GetAxisRaw("HorizontalKey"), 0f, Input.GetAxisRaw("VerticalKey")).normalized;

        // Play sound if current player and is walking
        if (isGrounded && targetVector.magnitude > 0)
        {
            playWalkSound = true;
        } else
        {
            playWalkSound = false;
        }

        var movementVector = MoveTowardTarget(targetVector);

        RotateTowardMovementVector(movementVector);

        if (isGrounded)
        {
            anim.SetBool("jumped", false);
            _jumpedAnimPlayed = false;
        }
        if (Input.GetButtonDown("Jump") )
        {
            if (isGrounded)
            {
                // Velocity needed to jump some height h: v = sqrt(h * -2 * gravity)
                velocity.y = Mathf.Sqrt(jumpHeight * -2f * gravity);
                playJumpSound = true;
                anim.SetBool("jumped", true);
                if (!_jumpedAnimPlayed)
                {
                    anim.Play("Jump");
                    _jumpedAnimPlayed = true;
                }
                

            } 
        }

        

        
        // Apply Gravity (gravity * t^2 = velocity)
        velocity.y += gravity * Time.deltaTime;
        controller.Move(velocity * Time.deltaTime);

    }



    private Vector3 MoveTowardTarget(Vector3 targetVector) {
        var speed = _moveSpeed * Time.deltaTime;

        targetVector = Quaternion.Euler(0,Camera.main.transform.eulerAngles.y, 0) * targetVector;
        controller.Move(targetVector * speed);
        return targetVector;
    }

    private void RotateTowardMovementVector(Vector3 movementVector)
    {
        if(movementVector.magnitude == 0) {
            anim.SetBool("isRunning", false);
            return; 
        }
        anim.SetBool("isRunning", true);
        var rotation = Quaternion.LookRotation(new Vector3(movementVector.z, 0, -movementVector.x));
        transform.rotation = Quaternion.RotateTowards(transform.rotation, rotation, rotateSpeed);
    }

    // Draw jump sphere for debugging
    void OnDrawGizmos()
    {
        Gizmos.color = Color.yellow;
        Gizmos.DrawWireSphere(groundCheck.position, groundCheckRadius);// Change to always see transform.position
    }





    /*    void Move()
        {
            // Normalize so diagonal movement doesnt go faster
            Vector3 direction = new Vector3(Input.GetAxisRaw("HorizontalKey"), 0f, Input.GetAxisRaw("VerticalKey")).normalized;
            float targetAngle = Mathf.Atan2(direction.x, direction.z) * Mathf.Rad2Deg + Camera.main.transform.eulerAngles.y;
            // Smooths numbers so rotation is smooth
            float angle = Mathf.SmoothDampAngle(transform.eulerAngles.y, targetAngle, ref turnSmoothVelocity, turnSmoothTime);
            var rotation = Quaternion.LookRotation(Quaternion.Euler(0, targetAngle, 0));

            transform.rotation = Quaternion.Euler(0f, angle, 0f);

            Vector3 moveDir = Quaternion.Euler(0f, targetAngle, 0f) * Vector3.forward;

            controller.Move(moveDir.normalized * moveSpeed * Time.deltaTime);
            if (anim)
            {
                anim.SetBool("isRunning", true);
            }
        }*/
}
    

